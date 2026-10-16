import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("KSR Dairy Foods render error:", error, info); }
  render() {
    if (this.state.error) return <div style={{fontFamily:"system-ui,sans-serif",maxWidth:680,margin:"10vh auto",padding:24,color:"#243528"}}><h1>KSR Dairy Foods</h1><h2>Something went wrong while opening the website.</h2><p>Reload the page. If the problem continues, check the browser console and deployment build logs.</p><button style={{padding:"12px 18px",border:0,borderRadius:10,background:"#315638",color:"white",fontSize:16}} onClick={() => window.location.reload()}>Reload website</button></div>;
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (root) createRoot(root).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
