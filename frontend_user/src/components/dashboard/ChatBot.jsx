import {
  Fab,
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Portal,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";

import { useAuth } from "../../context/AuthContext";
import { API_BASE_URL } from "../../services/api";

const ChatBot = ({ tenantSlug }) => {
  const { session } = useAuth();
  const activeRole = session?.role || "student";
  const isTeacher = activeRole === "teacher";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: isTeacher
        ? "Hello! I'm Ayra's AI Assistant. Ask me about today's teaching schedule, assigned sections, and class workload."
        : "Hello! I'm Ayra's AI Assistant. Ask me about your grades, CGPA, attendance, or today's classes.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const studentId = session?.profile?.studentId || session?.username || "CSE001";
  const userId = session?.username || "";
  const displayName = session?.displayName || "";
  const safeTenant = tenantSlug || session?.tenantSlug || "cgu";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt) return;

    const userMessage = { text: prompt, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/${safeTenant}/chatbot/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: prompt,
          role: activeRole,
          userId,
          displayName,
          studentId,
        }),
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          if (errorData?.error || errorData?.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch {
          // keep status fallback
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const botMessage = {
        text: data?.response || "I could not generate a reply right now.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { text: `Error: ${error.message}`, sender: "bot" };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Portal>
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => setOpen((current) => !current)}
          sx={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 1600,
          }}
        >
          <ChatIcon />
        </Fab>

        {open ? (
          <Paper
            elevation={12}
            sx={{
              position: "fixed",
              right: 16,
              bottom: 88,
              zIndex: 1600,
              width: { xs: "calc(100vw - 32px)", sm: 360 },
              maxWidth: "calc(100vw - 32px)",
              height: 420,
              borderRadius: 3,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                px: 1.5,
                py: 1,
                display: "flex",
                justifyContent: "flex-end",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <IconButton onClick={() => setOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                px: 1.5,
                pt: 1.5,
                pb: 1,
                flexGrow: 1,
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    bgcolor: msg.sender === "user" ? "#1976d2" : "#f5f5f5",
                    color: msg.sender === "user" ? "white" : "black",
                    borderRadius: 3,
                    px: 1.5,
                    py: 1,
                    maxWidth: "82%",
                    wordBreak: "break-word",
                    fontSize: 15,
                    lineHeight: 1.45,
                  }}
                >
                  {msg.text}
                </Box>
              ))}
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "flex-start", pt: 0.5 }}>
                  <CircularProgress size={20} />
                </Box>
              ) : null}
              <Box ref={messagesEndRef} />
            </Box>

            <Box
              sx={{
                p: 1.5,
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                gap: 1,
                alignItems: "center",
              }}
            >
              <TextField
                fullWidth
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !loading) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything..."
                disabled={loading}
                multiline
                maxRows={2}
                size="small"
              />
              <Button variant="contained" onClick={handleSend} disabled={loading} sx={{ minWidth: 64 }}>
                {loading ? <CircularProgress size={18} color="inherit" /> : "Send"}
              </Button>
            </Box>
          </Paper>
        ) : null}
      </Portal>
    </>
  );
};

export default ChatBot;
