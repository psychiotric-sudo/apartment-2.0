import React from "react";
import { X, Facebook, MessageCircle, Instagram, Sparkles } from "lucide-react";

const DeveloperModal = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (isOpen) document.body.classList.add('modal-open');
    else document.body.classList.remove('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const hobbies = [
    { name: "Civil Engineer", color: "#f59e0b" },
    { name: "Photography", color: "#ec4899" },
    { name: "Coding", color: "#10b981" },
  ];

  return (
    <div
      className={`modal-overlay active`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ zIndex: 99999 }}>
      <div
        className="modal"
        style={{
          maxWidth: "440px",
          padding: "0",
          overflow: "hidden",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: "32px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
        }}>
        {/* Decorative Header Background */}
        <div
          style={{
            height: "120px",
            background: "var(--accent-gradient)",
            opacity: 0.15,
            position: "relative",
          }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 2px 2px, var(--accent) 1px, transparent 0)",
              backgroundSize: "16px 16px",
              opacity: 0.3,
            }}></div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="icon-btn"
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: "white",
          }}>
          <X size={18} />
        </button>

        <div
          style={{
            padding: "0 40px 40px 40px",
            marginTop: "-60px",
            textAlign: "center",
          }}>
          {/* Profile Circle */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "40px",
              margin: "0 auto",
              border: "4px solid var(--bg)",
              padding: "4px",
              background: "var(--accent-gradient)",
              boxShadow: "0 15px 30px rgba(0,0,0,0.4)",
              transform: "rotate(-3deg)",
            }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "36px",
                overflow: "hidden",
                background: "var(--bg)",
              }}>
              <img
                src="/avatar.jpg"
                alt="Developer"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "rotate(3deg)",
                }}
              />
            </div>
          </div>

          {/* Identity */}
          <div style={{ marginTop: "24px" }}>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: "900",
                color: "white",
                letterSpacing: "-0.5px",
              }}>
              Charles
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                marginTop: "4px",
              }}>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "var(--accent)",
                }}>
                @chqrlzz
              </span>
              <div
                style={{
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "var(--text2)",
                  opacity: 0.3,
                }}></div>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text2)",
                  fontWeight: "600",
                }}>
                Full Stack Engineer
              </span>
            </div>
          </div>

          {/* Hobbies / Interests */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px",
              marginTop: "32px",
            }}>
            {hobbies.map((hobby) => (
              <span
                key={hobby.name}
                style={{
                  padding: "6px 12px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border)",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "var(--text2)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: hobby.color,
                  }}></div>
                {hobby.name}
              </span>
            ))}
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: "14px",
              color: "var(--text2)",
              lineHeight: "1.7",
              margin: "32px 0",
              opacity: 0.9,
            }}>
            Building high-performance web applications with a focus on
            minimalist design and exceptional user experience.
          </p>

          {/* Social Buttons - Outlined Style */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              marginTop: "12px",
            }}>
            <a
              href="https://facebook.com/chqrlzz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                fontSize: "13px",
                padding: "12px",
                minHeight: "48px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}>
              <Facebook size={18} color="#1877F2" /> Facebook
            </a>
            <a
              href="https://m.me/chqrlzz"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                fontSize: "13px",
                padding: "12px",
                minHeight: "48px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                textDecoration: "none",
              }}>
              <MessageCircle size={18} color="#00B2FF" /> Message
            </a>
            <a
              href="https://instagram.com/driyqnn_"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                fontSize: "13px",
                padding: "12px",
                minHeight: "48px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                textDecoration: "none",
                gridColumn: "span 2",
              }}>
              <Instagram size={18} color="#E4405F" /> Instagram
            </a>
          </div>

          {/* Footer Quote */}
          <div
            style={{
              marginTop: "40px",
              paddingTop: "24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              color: "var(--text2)",
              fontSize: "12px",
              fontWeight: "500",
            }}>
            <Sparkles size={14} color="var(--warn)" />
            <span>Always striving for better.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperModal;
