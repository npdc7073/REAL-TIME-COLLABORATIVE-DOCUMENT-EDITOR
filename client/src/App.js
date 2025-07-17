import React from "react";
import Editor from "./components/Editor";

function App() {
  const documentId = window.location.pathname.split("/")[1] || "default-doc";
  return (
    <div className="app">
      <h1>Real-Time Collaborative Document Editor</h1>
      <Editor documentId={documentId} />
    </div>
  );
}

export default App;
