import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Header from "./Header";
import { toast } from "react-toastify";

const SignUpSignIn = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [flag, setFlag] = useState(true); // Change to true for login first
  const navigate = useNavigate();

  const createUserDocument = async (user) => {
    setLoading(true);
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const userData = await getDoc(userRef);

    if (!userData.exists()) {
      const { displayName, email, photoURL } = user;
      const createdAt = new Date();

      try {
        await setDoc(userRef, {
          name: displayName ? displayName : name,
          email,
          photoURL: photoURL ? photoURL : "",
          createdAt,
        });
        toast.success("Account Created!");
        setLoading(false);
      } catch (error) {
        toast.error(error.message);
        console.error("Error creating user document: ", error);
        setLoading(false);
      }
    }
  };

  const signUpWithEmail = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = result.user;
      await createUserDocument(user);
      toast.success("Successfully Signed Up!");
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.message);
      console.error(
        "Error signing up with email and password: ",
        error.message
      );
      setLoading(false);
    }
  };

  const signInWithEmail = async (e) => {
    setLoading(true);
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      navigate("/dashboard");
      toast.success("Logged In Successfully!");
      setLoading(false);
    } catch (error) {
      toast.error(error.message);
      console.error(
        "Error signing in with email and password: ",
        error.message
      );
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      await createUserDocument(user);
      toast.success("User Authenticated Successfully!");
      setLoading(false);
      navigate("/dashboard");
    } catch (error) {
      setLoading(false);
      toast.error(error.message);
      console.error("Error signing in with Google: ", error.message);
    }
  };

  const styles = {
    wrapper: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f6f6f6",
      
    },
    container: {
      width: "380px",
      padding: "2rem",
      borderRadius: "20px",
      backgroundColor: "white",
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
      display: "flex",
      flexDirection: "column",
      //padding:"30px"
    },
    headerText: {
      textAlign: "center",
      fontSize: "24px",
      fontWeight: "600",
      marginBottom: "1.5rem",
      padding: "10px",
    },
    greenText: {
      color: "#4bba8e",
    },
    inputWrapper: {
      marginBottom: "1.2rem",
    },
    inputLabel: {
      fontSize: "14px",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "10px",
      fontSize: "14px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      marginTop: "5px",
      transition: "all 0.3s ease",
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#4bba8e",
      border: "none",
      borderRadius: "8px",
      color: "white",
      fontSize: "16px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      marginBottom: "1rem",
    },
    buttonOutline: {
      backgroundColor: "white",
      color: "#202020",
      border: "1px solid #2ecc71",
    },
    orText: {
      textAlign: "center",
     
      marginBottom:"2rem 0"
    },
    linkText: {
      color: "#202020",
      cursor: "pointer",
      textAlign: "center",
      marginTop: "0.5rem",
      marginBottom: "0",
    },
  };

  return (
    <>
      <Header />
      <div style={styles.wrapper}>
        {flag ? (
          <div style={styles.container}>
            <h2 style={styles.headerText}>
              Log in on <span style={styles.greenText}>Finance Mate</span>
            </h2>
            <form onSubmit={signInWithEmail}>
              <div style={styles.inputWrapper}>
                <p style={styles.inputLabel}>Email</p>
                <input
                  type="email"
                  placeholder="yourmail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputWrapper}>
                <p style={styles.inputLabel}>Password</p>
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                style={styles.button}
                disabled={loading}
              >
                {loading ? "Loading..." : "Login"}
              </button>
            </form>

            <p style={styles.orText}>or</p>

            <button
              onClick={signInWithGoogle}
              style={{ ...styles.button, ...styles.buttonOutline }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign in with Google"}
            </button>

            <p
              onClick={() => setFlag(!flag)}
              style={styles.linkText}
            >
              Don’t have an account? <span style={styles.greenText}>Click here</span>.
            </p>
          </div>
        ) : (
          <div style={styles.container}>
            <h2 style={styles.headerText}>
              Sign up on <span style={styles.greenText}>Finance Mate</span>
            </h2>
            <form onSubmit={signUpWithEmail}>
              <div style={styles.inputWrapper}>
                <p style={styles.inputLabel}>Full Name</p>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.inputWrapper}>
                <p style={styles.inputLabel}>Email</p>
                <input
                  type="email"
                  placeholder="yourmail@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputWrapper}>
                <p style={styles.inputLabel}>Password</p>
                <input
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputWrapper}>
                <p style={styles.inputLabel}>Confirm Password</p>
                <input
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                style={styles.button}
                disabled={loading}
              >
                {loading ? "Loading..." : "Sign up"}
              </button>
            </form>

            <p style={styles.orText}>or</p>

            <button
              onClick={signInWithGoogle}
              style={{ ...styles.button, ...styles.buttonOutline }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Sign up with Google"}
            </button>

            <p
              onClick={() => setFlag(!flag)}
              style={styles.linkText}
            >
              Already have an account? <span style={styles.greenText}>Click here</span>.
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default SignUpSignIn;
