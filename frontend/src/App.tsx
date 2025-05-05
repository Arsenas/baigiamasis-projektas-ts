import React from "react";
import Navbar from "./Components/Navbar";
import Pages from "./Pages/Pages";
import { BrowserRouter as Router } from "react-router-dom";

const App: React.FC = () => {
  return (
    <Router>
      <Navbar />
      <Pages />
    </Router>
  );
};

export default App;

console.log("💣 TESTAS – ar Git mato šitąaa?");
