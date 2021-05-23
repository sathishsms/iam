import os
import flask
import flask_sqlalchemy
import flask_praetorian
import flask_cors
from twilio.rest import Client

db = flask_sqlalchemy.SQLAlchemy()
guard = flask_praetorian.Praetorian()
cors = flask_cors.CORS()


# A generic user model that might be used by an app powered by flask-praetorian
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.Text, unique=True)
    password = db.Column(db.Text)
    roles = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, server_default='true')
    phone_number = db.Column(db.Text)
    verified = db.Column(db.Boolean, default=False, server_default='false')

    @property
    def rolenames(self):
        try:
            return self.roles.split(',')
        except Exception:
            return []

    @classmethod
    def lookup(cls, username):
        return cls.query.filter_by(username=username).one_or_none()

    @classmethod
    def identify(cls, id):
        return cls.query.get(id)

    @property
    def identity(self):
        return self.id

    def is_valid(self):
        return self.is_active


# Initialize flask app for the example
app = flask.Flask(__name__, static_folder='../frontend/build/static')
app.debug = True
app.config['SECRET_KEY'] = 'top secret'
app.config['JWT_ACCESS_LIFESPAN'] = {'hours': 24}
app.config['JWT_REFRESH_LIFESPAN'] = {'days': 30}
app.config.update(os.environ)
# Initialize the flask-praetorian instance for the app
guard.init_app(app, User)

# Initialize Twilio client
client = Client()

# Initialize a local database for the example
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.getcwd(), 'database.db')}"
db.init_app(app)

# Initializes CORS so that the api_tool can talk to the example app
cors.init_app(app)

# Add users for the example
with app.app_context():
    db.create_all()
    if db.session.query(User).filter_by(username='signeasy').count() < 1:
        db.session.add(User(
            username='signeasy',
            password=guard.hash_password('password'),
            roles='admin',
            phone_number="9738400032",
            verified=True
        ))
    db.session.commit()


# Set up some routes for the example
@app.route('/api/')
def home():
    return {"Hello": "World"}, 200


@app.route('/api/login', methods=['POST'])
def login():
    """
    Logs a user in by parsing a POST request containing user credentials and
    issuing a JWT token.
    .. example::
       $ curl http://localhost:5000/api/login -X POST \
         -d '{"username":"Yasoob","password":"strongpassword"}'
    """
    req = flask.request.get_json(force=True)
    username = req.get('username', None)
    password = req.get('password', None)
    user = guard.authenticate(username, password)
    ret = {'access_token': guard.encode_jwt_token(user)}
    return ret, 200


@app.route('/api/refresh', methods=['POST'])
def refresh():
    """
    Refreshes an existing JWT by creating a new one that is a copy of the old
    except that it has a refrehsed access expiration.
    .. example::
       $ curl http://localhost:5000/refresh -X GET \
         -H "Authorization: Bearer <your_token>"
    """
    print("refresh request")
    old_token = request.get_data()
    new_token = guard.refresh_jwt_token(old_token)
    ret = {'access_token': new_token}
    return ret, 200


@app.route('/api/protected')
@flask_praetorian.auth_required
def protected():
    """
    A protected endpoint. The auth_required decorator will require a header
    containing a valid JWT
    .. example::
       $ curl http://localhost:5000/api/protected -X GET \
         -H "Authorization: Bearer <your_token>"
    """
    message = ""
    if flask_praetorian.current_user().roles == "admin":
        message = f"welcome  {flask_praetorian.current_user().username} admin, this is protected endpoint"
    else:
        message = f'Endpoint not allowed for user {flask_praetorian.current_user().username}'
    return {"message":  message}


def check_verification(phone, code):
    service = app.config.get("VERIFICATION_SID")
    phone = f'+91{phone}'
    print(f'parameters to verify the phone {phone} and cose {code} ')
    verification_check = client.verify \
        .services(service) \
        .verification_checks \
        .create(to=phone, code=code)

    if verification_check.status == "approved":
        print('Your phone number has been verified! Please login to continue.')
        return flask.make_response(flask.jsonify(
            category="success",
        ), 200)
    else:
        print('The code you provided is incorrect. Please try again.')
        return flask.make_response(flask.jsonify(
            category="error",
        ), 400)


@app.route('/api/otp', methods=['POST'])
def start_verification():
    req = flask.request.get_json(force=True)
    to = req['phone_number']
    service = app.config.get("VERIFICATION_SID")
    if to != "":
        to = f'+91{to}'
        print(f'twilo verification check phone: {to}')
        verification = client.verify \
            .services(service) \
            .verifications \
            .create(to=to, channel="sms")
        return flask.make_response(flask.jsonify(
            category="success",
        ), 200)
    else:
        print("to is None")
        return flask.make_response(flask.jsonify(
            category="error",
        ), 400)


@app.route('/api/verify', methods=['POST'])
def verify():
    """Verify a user on registration with their phone number"""
    if flask.request.method == 'POST':
        req = flask.request.get_json(force=True)
        phone = req.get('phone')
        code = req['code']
        return check_verification(phone, code)


@app.route('/')
# @app.route('/<path:path>')
def catch_all():
    print("Hello from catch all")
    path_d = os.path.join('..', 'frontend', 'build')
    if os.path.exists(path_d):
        #     print("Hello from catch all" + path_d)
        #     return app.send_static_file(os.path.join(path_d, 'index.html'))
        # else:
        return flask.send_from_directory(path_d, 'index.html')


@app.route("/api/register", methods=["POST"])
def register():
    req = flask.request.get_json(force=True)
    username = req.get('username', None)
    password = req.get('password', None)
    try:
        db.session.add(User(
            username=username,
            password=guard.hash_password(password),
            roles="user"
        ))
        db.session.commit()
        return flask.make_response(flask.jsonify(
                category="success",
            ), 200)
    except Exception as ex:
        print(f'error exception: {ex}')
        return flask.make_response(flask.jsonify(
            category="error",
        ), 400)

# Run the example
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
