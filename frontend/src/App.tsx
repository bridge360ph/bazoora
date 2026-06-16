import { useEffect, useState } from "react";
import './App.css'

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
  fetch("http://localhost:3000/")
    .then((res) => res.json())
    .then((data) => {
      console.log("backend response:", data);
      setMessage(data.status);
    })
    .catch((err) => {
      console.error("fetch error:", err);
      setMessage("error");
    });
}, []);

  return <h1>Backend Status: {message}</h1>;
}

export default App
