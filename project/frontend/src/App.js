import React, { useEffect, useState } from "react";
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link
} from "react-router-dom";
import { login, authFetch, useAuth, logout } from "./auth"

const PrivateRoute = ({ component: Component, ...rest }) => {
  const [logged] = useAuth();

  return <Route {...rest} render={(props) => (
    logged
      ? <Component {...props} />
      : <Redirect to='/login' />
  )} />
}


toast.configure()
export default function App() {
  const [logged] = useAuth();
  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-light fixed-top">
          <div className="container">
            <Link className="navbar-brand" to={"/sign-in"}>IAM</Link>
            <div className="collapse navbar-collapse" id="navbarTogglerDemo02">
              <ul className="navbar-nav ml-auto">
                <li className="nav-item">
                  <Link className="nav-link" to={"/sign-in"}>{logged ? "Logout" : "Login"}</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={"/sign-up"}>{logged ? "" : "Sign-up"}</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to={"/secret"}>{logged ? "API-1" : ""}</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="auth-wrapper">
          <div className="auth-inner">
            <Switch>
              <Route exact path='/' component={Home} />
              <Route path="/sign-in" component={Login} />
              <Route path="/sign-up" component={SignUp} />
              <PrivateRoute path="/secret" component={Secret} />
            </Switch>
          </div>
        </div>
      </div></Router>
  );
}

function Home() {
  return <h2>Home</h2>;
}

function SignUp() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otpcode, setOtpcode] = useState('')
  const [otpEnable, setOtpEnable] = useState(false)
  const [otpCheck, setOtpCheck] = useState(false)

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const handlePhoneChange = (e) => {
    setPhone(e.target.value)

  }
  const handleOtpChange = (e) => {
    setOtpcode(e.target.value)
  }
  const onSubmitClick = (e) => {
    e.preventDefault()
    console.log("You pressed login")
    let opts = {
      'username': username,
      'password': password
    }
    console.log(opts)
    fetch('/api/register', {
      method: 'post',
      body: JSON.stringify(opts)
    }).then(r => r.json())
      .then(
        console.log("Signed up")
      )
  }

  const onSubmitOTP = (e) => {
    e.preventDefault()
    console.log("You pressed phone number verify:" + phone)
    let opts = {
      'phone_number': phone
    }
    // console.log(opts)
    fetch('/api/otp', {
      method: 'post',
      body: JSON.stringify(opts)
    }).then(response => {
      switch (response.status) {
        case 200:
          console.log('success')
          toast('OTP sent')
          setOtpEnable(true)
          break
        case 400:
          console.log('got 400 status')
          toast('Ensure Phone number to trigger OTP')
          setOtpEnable(false)
          break
      }
    }
    ).catch(error => (console.log("phone number error: ", error), setOtpEnable(false)))
  }

  const onVerifyOTP = (e) => {
    e.preventDefault()
    let opts = {
      'phone': phone,
      'code': otpcode
    }
    console.log(opts)
    fetch('/api/verify', {
      method: 'post',
      body: JSON.stringify(opts)
    }).then(response => {
      switch (response.status) {
        case 200:
            console.log("phone number verified: ", response)
            toast('phone number verified')
            setOtpcode("")
            setPhone("")
            setOtpEnable(false)
            setOtpCheck(true)
          break
        case 400:
          console.log('got 400 status')
          toast('phone number un-verified')
          setOtpEnable(false)
          break
      }
    }
    ).catch(error => console.log("phone number not verified: ", error), setOtpCheck(false))
  }
  return (
    <div className="body wrapper fadeInDown" >
      <div id="formContent">
        <form action="#">
          <h3>Sign Up</h3>
          <label>Name</label>
          <input type="text" className="form-control" placeholder="Full name" />


          <label>Username</label>
          <input type="test" className="form-control" placeholder="Enter username" onChange={handleUsernameChange} />

          <label>Password</label>
          <input type="password" className="form-control" placeholder="Enter password" onChange={handlePasswordChange} />

          <label>Phone number</label>
          <input type="tel" className="form-control" disabled={otpEnable} placeholder="Phone number say 9998877766" onChange={handlePhoneChange} maxLength="10" pattern="[1-9]{1}[0-9]{9}" />
          {otpEnable ?
            <span>
              <input type="number" className="form-control" placeholder="Enter OTP received through SMS" onChange={handleOtpChange} />
              <button type="submit" onClick={onVerifyOTP} className="btn btn-secondary">Validate OTP</button>
            </span>
            : <button type="submit" disabled={otpCheck} onClick={onSubmitOTP} className="fadeIn fourth btn-secondary">{otpCheck ? "verified" : "Verify Phone"}</button>
          }
          <div id="formFooter">
            <button type="submit" disabled={!otpCheck} onClick={onSubmitClick} className="btn btn-primary btn-block">Sign Up</button>
          </div>
          <p className="forgot-password text-right">
            Already registered <a href="/sign-in">sign in?</a>
          </p>
        </form>
      </div> </div>
  );

}
function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const [logged] = useAuth();

  const onSubmitClick = (e) => {
    e.preventDefault()
    console.log("You pressed login")
    let opts = {
      'username': username,
      'password': password
    }
    console.log(opts)
    fetch('/api/login', {
      method: 'post',
      body: JSON.stringify(opts)
    }).then(r => r.json())
      .then(token => {
        if (token.access_token) {
          login(token)
          console.log(token)
          toast('Login Success') 
        }
        else {
          console.log("Please type in correct username/password")
          toast('Please type in correct username/password') 
        }
      })
  }

  const handleUsernameChange = (e) => {
    setUsername(e.target.value)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  return (
    <div className="wrapper fadeInDown">
      <div id="formContent">
        {!logged ? <form action="#">
          <h3>Sign In</h3>
          <input type="text" className="fadeIn first" id="login"
            placeholder="Username"
            onChange={handleUsernameChange}
            value={username}
          />

          <input
            type="password" className="fadeIn second" id="password2"
            placeholder="Password"
            onChange={handlePasswordChange}
            value={password}
          />
          <div className="form-group">
            <div className="custom-control custom-checkbox">
              <input type="checkbox" className="custom-control-input" id="customCheck1" />
              <label className="custom-control-label" htmlFor="customCheck1">Remember me</label>
            </div>
          </div>

          <button type="submit" className="fadeIn fourth btn-primary" onClick={onSubmitClick}  >Login</button>
          <p id="formFooter" className="forgot-password text-right">
            Forgot <a href="#">password?</a>
          </p>
        </form>
          :


          <div className="App"> <br /><br /><br />
            <button onClick={() => logout()}>Logout</button> </div>}
      </div> </div>
  )
}

function Secret() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    authFetch("/api/protected").then(response => {
      if (response.status === 401) {
        setMessage("Sorry you aren't authorized!")
        return null
      }
      return response.json()
    }).then(response => {
      if (response && response.message) {
        setMessage(response.message)
        console.log("secret message: " + message)
      }
    })
  }, [])
  return (
    <h2>Secret: {message}</h2>
  )
}
