import React, { useState } from "react";
import "./App.css";

function App() {
  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const url = isSignup
      ? "http://13.232.98.155:30051/api/signup"
      : "http://13.232.98.155:30051/api/login";

    const payload = isSignup
      ? form
      : { email: form.email, password: form.password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert(isSignup ? "✅ Signup successful!" : "✅ Login successful!");
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (error) {
      alert("❌ Backend not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>{isSignup ? "Create Account" : " User Login"}</h2>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleChange}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Processing..."
              : isSignup
              ? "Sign Up"
              : "Login"}
          </button>
        </form>

        <p className="toggle">
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? " Login" : " Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;

