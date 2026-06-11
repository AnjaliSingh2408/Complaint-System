import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] =
    useState({
      fullName: "",
      username: "",
      email: "",
      password: "",
      phoneNo: "",
    });

  const [error, setError] =
    useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(formData);

      navigate("/login");
    } catch (error) {
      setError(
        error.response?.data
          ?.message ||
          "Registration failed"
      );
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="glass-panel auth-card">
        <h2>Register Citizen</h2>

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            className="input-field"
            onChange={handleChange}
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            className="input-field"
            onChange={handleChange}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input-field"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input-field"
            onChange={handleChange}
          />

          <input
            type="text"
            name="phoneNo"
            placeholder="Phone Number"
            className="input-field"
            onChange={handleChange}
          />

          <button className="btn-primary">
            Register
          </button>
        </form>

        <p>
          Already have account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;