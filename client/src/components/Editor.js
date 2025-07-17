import React, { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import jsPDF from "jspdf";

const socket = io("http://localhost:5000");

const Editor = ({ documentId }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    socket.emit("get-document", documentId);

    socket.on("load-document", (document) => {
      setContent(document);
    });

    socket.on("receive-changes", (newContent) => {
      setContent(newContent);
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setContent(value);
    socket.emit("send-changes", value);
  }, []);

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 10, 10);
    doc.save(`${documentId}.pdf`);
  };

  const saveToDB = async () => {
    try {
      const response = await fetch("http://localhost:5000/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId, content }),
      });
      if (response.ok) {
        alert("Document saved successfully!");
      } else {
        alert("Save failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving document");
    }
  };

  return (
    <div className="editor-container">
      <textarea
        className="editor"
        value={content}
        onChange={handleChange}
        placeholder="Start writing..."
      ></textarea>
      <div className="button-group">
        <button onClick={downloadPDF}>Download PDF</button>
        <button onClick={saveToDB}>Save to DB</button>
      </div>
    </div>
  );
};

export default Editor;
