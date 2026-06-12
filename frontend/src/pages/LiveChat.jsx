import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import io from "socket.io-client";

import api from "../api/axios";
import { useAuth } from "../context/useAuth";

import {
  FaPaperPlane,
  FaArrowLeft,
} from "react-icons/fa";

const socket =
  io(import.meta.env.VITE_SOCKET_URL || "https://complaint-system-g0tt.onrender.com", {
    withCredentials: true,
  });

function LiveChat() {
  const { complaintId } =
    useParams();

  const navigate =
    useNavigate();

  const { user } =
    useAuth();

  const [messages,
    setMessages] =
    useState([]);

  const [text,
    setText] =
    useState("");

  const bottomRef =
    useRef();

  useEffect(() => {
    fetchMessages();

    socket.emit(
      "join_complaint_room",
      {
        complaintId,
        userId:
          user?._id,
      }
    );

    socket.on(
      "receive_message",
      (
        newMessage
      ) => {
        setMessages(
          (prev) => [
            ...prev,
            newMessage,
          ]
        );
      }
    );

    return () => {
      socket.off(
        "receive_message"
      );
    };
  }, [
    complaintId,
    user?._id,
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView(
      {
        behavior:
          "smooth",
      }
    );
  }, [messages]);

  const fetchMessages =
    async () => {
      try {
        const res =
          await api.get(
            `/messages/${complaintId}`
          );

        setMessages(
          res.data.data
            .messages
        );
      } catch (
        error
      ) {
        console.log(
          error
        );
      }
    };

  const sendMessage =
    () => {
      if (
        !text.trim()
      )
        return;

      const payload =
        {
          complaintId,
          senderId:
            user._id,
          text,
        };

      socket.emit(
        "send_message",
        payload
      );

      setText("");
    };

  const handleKeyDown =
    (e) => {
      if (
        e.key ===
        "Enter"
      ) {
        sendMessage();
      }
    };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div
            style={{
              display:
                "flex",
              alignItems:
                "center",
              gap: "12px",
            }}
          >
            <button
              className="back-btn"
              onClick={() =>
                navigate(
                  -1
                )
              }
            >
              <FaArrowLeft />
            </button>

            <div>
              <h2>
                Complaint
                Chat
              </h2>

              <p
                style={{
                  opacity:
                    0.7,
                  fontSize:
                    "0.9rem",
                }}
              >
                Ticket #
                {complaintId.slice(
                  0,
                  8
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map(
            (
              msg,
              index
            ) => {
              const sender =
                typeof msg.senderId ===
                "object"
                  ? msg
                      .senderId
                      ?._id
                  : msg.senderId;

              const isMe =
                sender ===
                user._id;

              return (
                <div
                  key={
                    index
                  }
                  className={`message-row ${
                    isMe
                      ? "my-message"
                      : "other-message"
                  }`}
                >
                  <div className="message-bubble">
                    <p>
                      {
                        msg.text
                      }
                    </p>

                    <span className="message-time">
                      {new Date(
                        msg.createdAt
                      ).toLocaleTimeString(
                        [],
                        {
                          hour:
                            "2-digit",
                          minute:
                            "2-digit",
                        }
                      )}
                    </span>
                  </div>
                </div>
              );
            }
          )}

          <div
            ref={
              bottomRef
            }
          />
        </div>

        {/* Input */}
        <div className="chat-input-area">
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(
              e
            ) =>
              setText(
                e.target
                  .value
              )
            }
            onKeyDown={
              handleKeyDown
            }
            className="chat-input"
          />

          <button
            onClick={
              sendMessage
            }
            className="send-btn"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveChat;