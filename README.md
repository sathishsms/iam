## IAM - Identity Authentication Management

Learn more about this project via this <a href="https://github.com/sathishsms">IAM Framework</a>.

### Description
Design and implement an authentication and authorisation module / microservice:
1. Authentication should take care of logging in the user and passing on an authorization token to be used in subsequent requests
2. The token should be used in all successive API request authorization
3. Factor in API authentication using API keys and secrets - same user can have multiple API keys and Secrets
4. Implement MFA (multi-factor authentication) using SMSs (you can use a Trial on Twillio for this)
5. Good to have - Design and implementation of RBAC (role based access control) - you can assume three different roles - admin, member, read-only member, and three resources - manage team (add, edit, delete members) for admins, add / delete document - for admins and members, view documents (RO members).
Please ensure that your code is executable and can be deployed and tested quickly, maybe by using a Postman collection. Structure and document your code for clarity and legibility. Pay close attention to negative scenarios. If you use any open source identity / RBAC framework, please evaluate and justify the use of the particular framework over others.


It covers:

- Building a simple React front-end using the ONE-UI library
- Designing a Flask API that receives data from the front-end
- Setting up a domain name and an SSL certificate with Nginx
- Deployment using docker-compose



### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

#### Development Mode:
Two terminals - one for frontend and one for backend

##### frontend
> cd ./src/frontend
> npm install
> npm run start
##### backend
> cd ./src/backend
> ./venv/bin/activate
> pip install -r requirements.txt
> flask run

#### Stagging Mode:
>docker-compose -f .\docker-compose.dev.yml up

#### Production Mode:
This is pending
>docker-compose up

Verify the deployment by navigating to your server address in your preferred browser.

```sh
127.0.0.1:9090
```

* [IAM](http://localhost:9090) - HTML enhanced for web apps!
