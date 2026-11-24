"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { registerAction } from "@/app/actions/auth";

const BOOKS = [
  { title: "A Curse for True Love", image: "/images/books/a-curse-for-true-love-stephanie-garber.jpg" },
  { title: "About You", image: "/images/books/about-you-visya-nabila.jpg" },
  { title: "Bulan", image: "/images/books/bulan-tere-liye.jpg" },
  { title: "Bumi", image: "/images/books/bumi-tere-liyejpg.jpg" },
  { title: "Doughslove", image: "/images/books/doughslove-carlene-ann.jpg" },
  { title: "Hello, Cello!", image: "/images/books/hello-cello-nadia-restivani.jpg" },
  { title: "High Reputation", image: "/images/books/high-reputation-quinn.jpg" },
  { title: "Kembali ke Batavia", image: "/images/books/kembali-ke-batavia-gigrey.jpg" },
  { title: "Laskar Pelangi", image: "/images/books/laskar-pelangi-andrea-hirata.jpg" },
  { title: "Little Red Riding Hood", image: "/images/books/little-red-riding-hood-ruwi-meita.jpg" },
  { title: "Lotus in the Mud", image: "/images/books/lotus-in-the-mud-annelie.jpg" },
  { title: "Mada", image: "/images/books/mada-gigrey.jpg" },
  { title: "Malioboro at Midnight", image: "/images/books/malioboro-at-midnight-skysphiere.jpg" },
  { title: "Matahari", image: "/images/books/matahari-tere-liye.jpg" },
  { title: "Negeri 5 Menara", image: "/images/books/negeri-5-menara-ahmad-fuadi.jpg" },
  { title: "Once Upon a Broken Heart", image: "/images/books/once-upon-a-broken-heart-stephanie-garber.jpg" },
  { title: "Perahu Kertas", image: "/images/books/perahu-kertas-dee-lestari.jpg" },
  { title: "Surat untuk Jenaka", image: "/images/books/surat-untuk-jenaka-gigrey.jpg" },
  { title: "Teka-Teki Shaka", image: "/images/books/teka-teki-shaka-zahira-aulia.jpg" },
  { title: "The Ballad of Never After", image: "/images/books/the-ballad-of-never-after-stephanie-garber.jpg" },
  { title: "The Hunger Games", image: "/images/books/the-hunger-games-suzanne-collins.jpg" },
  { title: "The Little Prince", image: "/images/books/the-little-prince-antoine-de-saint-exupery.jpg" },
  { title: "The Secret of a Heart Note", image: "/images/books/the-secret-of-a-heart-note-stacey-lee.jpg" },
  { title: "True Colors", image: "/images/books/true-colors-gladys-cornelia.jpg" },
  { title: "Wonder", image: "/images/books/wonder-r-j-palacio.jpg" },
];

function BookWall() {
  const columns = [
    BOOKS.slice(0, 8),
    BOOKS.slice(8, 16),
    BOOKS.slice(16),
  ];

  return (
    <div className="register-wall-columns">
      {columns.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className={`register-wall-column ${
            columnIndex % 2 === 0 ? "wall-up" : "wall-down"
          }`}
        >
          <div className="register-wall-track">
            {[...column, ...column, ...column].map((book, index) => (
              <div
                className="register-book"
                key={`${book.title}-${index}`}
              >
                <img
                  src={book.image}
                  alt={book.title}
                  loading="lazy"
                  draggable="false"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function BookMascot({
  passwordFocused,
  showPassword,
  mousePosition,
}) {
  const eyeStyle = {
    transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`,
  };

  const isClosed = passwordFocused && !showPassword;

  return (
    <div className="register-mascot-wrapper">
      <div
        className={`register-mascot ${
          isClosed ? "mascot-closed" : ""
        } ${showPassword ? "mascot-peeking" : ""}`}
      >
        <div className="mascot-spine" />

        <div className="mascot-face">
          <div className="mascot-eyes">
            <div className="mascot-eye">
              <div
                className="mascot-pupil"
                style={eyeStyle}
              />
            </div>

            <div className="mascot-eye">
              <div
                className="mascot-pupil"
                style={eyeStyle}
              />
            </div>
          </div>

          <div className="mascot-mouth" />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0,
  });

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [nim, setNim] = useState("");
  const [nimTouched, setNimTouched] = useState(false);

  const [formProgress, setFormProgress] = useState(0);

  const passwordRef = useRef(null);

  useEffect(() => {
    function handleMouseMove(event) {
      const mascot = document.querySelector(".register-mascot");

      if (!mascot) return;

      const rect = mascot.getBoundingClientRect();

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;

      setMousePosition({
        x: Math.max(-3, Math.min(3, deltaX / 35)),
        y: Math.max(-3, Math.min(3, deltaY / 35)),
      });
    }

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const validEmail =
      /^[^\s@]+@[^\s@]+\.ac\.id$/i.test(email.trim());

    const validNim =
      /^[a-zA-Z0-9]+$/.test(nim.trim()) && nim.trim() !== "";

    const completed = [
      validEmail,
      validNim,
      password.length >= 8,
    ].filter(Boolean).length;

    setFormProgress(completed);
  }, [email, nim, password]);

  const emailIsValid =
    email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.ac\.id$/i.test(email.trim());

  const emailHasError =
    emailTouched &&
    email.trim() !== "" &&
    !emailIsValid;

  const nimIsValid =
    nim.trim() !== "" &&
     /^[a-zA-Z0-9]+$/.test(nim.trim());

  const nimHasError =
    nimTouched &&
    nim.trim() !== "" &&
    !nimIsValid;

  const passwordStrength = (() => {
    if (!password) return 0;

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(4, score);
  })();

  const strengthText = [
    "",
    "Sangat lemah",
    "Lemah",
    "Sedang",
    "Kuat",
  ][passwordStrength];

  const strengthColors = [
    "",
    "#FF5F7E",
    "#F5A623",
    "#29B8A5",
    "#43C59E",
  ];

  async function handleRegister(formData) {
    setError("");
    setSuccess("");

    formData.set("email", email.trim());
    formData.set("nama", formData.get("nama") || "");
    formData.set("nomor_identitas", nim.trim());
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    if (!emailIsValid) {
      setError("Gunakan email kampus dengan domain .ac.id.");
      return;
    }

    if (!nimIsValid) {
      setError("Nomor identitas hanya boleh berisi angka dan huruf.");
      return;
    }

    if (password.length < 8) {
      setError("Password harus memiliki minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerAction(formData);

      if (result?.error) {
        setError(result.error);
      }

      if (result?.success) {
        setSuccess(result.success);
      }
    } catch (err) {
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        throw err;
      }

      setError("Terjadi kesalahan. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <style jsx>{`
        .register-page {
          width: 100%;
          min-height: 100vh;
          background: #f5f0e8;
        }

        .register-container {
          width: 100%;
          min-height: 100vh;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          background: #f5f0e8;
        }

        .register-wall {
          position: sticky;
          top: 0;
          height: 100vh;
          min-height: 0;
          overflow: hidden;
          background: #100d25;
        }

        :global(.register-wall-columns) {
          position: absolute;
          inset: 0;
          display: flex;
          gap: 18px;
          padding: 0 24px;
          overflow: hidden;
        }

        :global(.register-wall-column) {
          flex: 1;
          min-width: 0;
          height: 100%;
          overflow: hidden;
          position: relative;
        }

        :global(.register-wall-track) {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: 100%;
          will-change: transform;
        }

        :global(.wall-up .register-wall-track) {
          animation: registerWallUp 40s linear infinite;
        }

        :global(.wall-down .register-wall-track) {
          animation: registerWallDown 46s linear infinite;
        }

        :global(.register-book) {
          width: 100%;
          aspect-ratio: 2 / 3;
          flex-shrink: 0;
          border-radius: 7px;
          overflow: hidden;
          position: relative;
          background: #29213f;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        }

        :global(.register-book img) {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        :global(.register-book:hover img) {
          transform: scale(1.04);
        }

        .register-wall-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(16, 13, 37, 0.08) 0%,
            rgba(16, 13, 37, 0.12) 40%,
            rgba(16, 13, 37, 0.75) 75%,
            rgba(16, 13, 37, 0.96) 100%
          );
          pointer-events: none;
        }

        .register-wall-caption {
          position: absolute;
          z-index: 2;
          left: 7%;
          right: 7%;
          bottom: 7%;
          color: #f5f0e8;
        }

        .register-wall-caption h1 {
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.03em;
          margin: 0;
        }

        .register-wall-caption h1 span {
          color: #f5b83e;
        }

        .register-wall-caption p {
          max-width: 400px;
          font-size: 15px;
          color: #c9bfdc;
          margin-top: 20px;
          line-height: 1.8;
        }

        .register-wall-brand {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 48px;
          font-size: 13px;
          letter-spacing: 0.35em;
          color: #f5b83e;
        }

        .brand-line {
          width: 55px;
          height: 2px;
          background: #f5b83e;
        }

        .register-form-panel {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 36px 24px;
          box-sizing: border-box;
          background: #211b49;
        }

        .register-card {
          width: 100%;
          max-width: 520px;
          padding: 42px 38px;
          box-sizing: border-box;
          background: #211b49;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          box-shadow: 0 20px 60px rgba(28, 20, 60, 0.12);
        }

        .register-header {
          text-align: center;
        }

        .register-header h2 {
          font-family: var(--font-playfair);
          font-size: 42px;
          font-weight: 700;
          margin-top: 18px;
          line-height: 1.1;
          color: #f5f0e8;
        }

        .register-header .welcome {
          color: #f5b83e;
          letter-spacing: 0.08em;
          font-size: 13px;
          font-weight: 700;
          margin-top: 24px;
        }

        .register-role-badges {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 24px;
          flex-wrap: wrap;
        }

        .register-role-badges span {
          padding: 8px 15px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: 700;
        }

        .role-admin {
          background: #813d76;
          color: white;
        }

        .role-pegawai {
          background: #a87926;
          color: #fff1d2;
        }

        .role-mahasiswa {
          background: #325d9e;
          color: white;
        }

        .register-progress {
          display: flex;
          gap: 10px;
          margin-top: 28px;
          margin-bottom: 32px;
        }

        .register-progress-segment {
          flex: 1;
          height: 5px;
          border-radius: 10px;
          background: #474064;
          transition: background 0.3s ease;
        }

        .register-progress-segment.active {
          background: #f5b83e;
        }

        .register-field {
          margin-bottom: 20px;
        }

        .register-field label {
          display: block;
          text-align: left;
          font-size: 12px;
          font-weight: 700;
          color: #b9b1d5;
          margin-bottom: 8px;
        }

        .register-field input,
        .register-field textarea {
          width: 100%;
          background: #302957;
          border: 1px solid #514675;
          color: #f5f0e8;
          padding: 13px 15px;
          border-radius: 12px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }

        .register-field input:focus,
        .register-field textarea:focus {
          border-color: #f5b83e;
          box-shadow: 0 0 0 2px rgba(245, 184, 62, 0.12);
        }

        .register-field input::placeholder,
        .register-field textarea::placeholder {
          color: #a7a0c3;
        }

        .register-field input.invalid {
          border-color: #ff5f7e;
        }

        .register-field input.valid {
          border-color: #35c5a2;
        }

        .register-field textarea {
          resize: none;
        }

        .register-field-message {
          font-size: 10px;
          margin-top: 7px;
        }

        .register-field-message.error {
          color: #ff708c;
        }

        .register-field-message.success {
          color: #39c9a5;
        }

        .password-input-wrapper {
          position: relative;
        }

        .password-input-wrapper input {
          padding-right: 60px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: #a9a1c6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 5px;
        }

        .password-toggle:hover {
          color: #f5b83e;
        }

        .password-strength {
          margin-top: 10px;
        }

        .password-strength-bars {
          display: flex;
          gap: 5px;
        }

        .password-strength-bars span {
          flex: 1;
          height: 5px;
          border-radius: 20px;
          background: #494165;
          transition: background 0.3s ease;
        }

        .password-strength-bars span.active {
          background: var(--strength-color);
        }

        .password-strength-label {
          font-size: 10px;
          color: #a7a0c3;
          margin-top: 7px;
        }

        .register-submit {
          width: 100%;
          border: none;
          cursor: pointer;
          background: #f5b83e;
          color: #17132e;
          font-size: 13px;
          font-weight: 800;
          padding: 14px;
          border-radius: 40px;
          margin-top: 12px;
          transition: all 0.25s ease;
        }

        .register-submit:hover {
          background: #ffca5e;
          transform: translateY(-1px);
        }

        .register-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

.register-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 28px 0;
  color: #a7a0c3;
  font-size: 12px;
}

.register-divider::before,
.register-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #494165;
}

.register-guest {
  width: 100%;
  display: flex !important;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 14px 20px;
  border: 1px solid #655a86;
  border-radius: 40px;
  background-color: #302957;
  color: #f5f0e8 !important;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none !important;
  box-sizing: border-box;
  transition: all .2s ease;
}

.register-guest:hover {
  background-color: #3b3265;
  border-color: #f5b83e;
  color: #f5b83e !important;
}

        .register-footer {
          text-align: center;
          font-size: 12px;
          color: #a7a0c3;
          margin-top: 28px;
        }

        .register-footer a {
          color: #f5b83e;
          font-weight: 700;
          text-decoration: none;
        }

        .register-footer a:hover {
          text-decoration: underline;
        }

        .register-message {
          padding: 12px;
          border-radius: 12px;
          font-size: 12px;
          margin-bottom: 15px;
        }

        .register-message.error {
          background: rgba(255, 95, 126, 0.12);
          border: 1px solid rgba(255, 95, 126, 0.35);
          color: #ff8da4;
        }

        .register-message.success {
          background: rgba(67, 197, 158, 0.12);
          border: 1px solid rgba(67, 197, 158, 0.35);
          color: #69dfbf;
        }

        .register-mascot-wrapper {
          display: flex;
          justify-content: center;
        }

        .register-mascot {
          width: 76px;
          height: 94px;
          border-radius: 19px;
          background: #f5b83e;
          position: relative;
          box-shadow: inset 8px 0 0 rgba(170, 115, 19, 0.35);
          transition: transform 0.3s ease;
          animation: mascotFloat 3s ease-in-out infinite;
        }

        .register-mascot:hover {
          transform: rotate(-3deg);
        }

        .mascot-spine {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 12px;
          border-radius: 19px 0 0 19px;
          background: #d99a22;
        }

        .mascot-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 13px;
        }

        .mascot-eyes {
          display: flex;
          gap: 10px;
        }

        .mascot-eye {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          background: white;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          transition: height 0.2s ease;
        }

        .mascot-pupil {
          width: 7px;
          height: 7px;
          background: #211b49;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }

        .mascot-mouth {
          width: 21px;
          height: 10px;
          border-bottom: 2px solid #211b49;
          border-radius: 0 0 50% 50%;
        }

        .mascot-closed .mascot-eye {
          height: 3px;
          border-radius: 0;
          margin-top: 7px;
        }

        .mascot-closed .mascot-pupil {
          opacity: 0;
        }

        .mascot-peeking .mascot-eye {
          transform: translateY(-2px);
        }

        @keyframes mascotFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes registerWallUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-33.333%);
          }
        }

        @keyframes registerWallDown {
          0% {
            transform: translateY(-33.333%);
          }
          100% {
            transform: translateY(0);
          }
        }

        @media (max-width: 1100px) and (min-width: 601px) {
          .register-container {
            grid-template-columns: 0.9fr 1.1fr;
          }

          .register-card {
            padding: 32px 26px;
          }
        }

        @media (max-width: 600px) {
          .register-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
          }

          .register-wall {
            position: relative;
            top: auto;
            width: 100%;
            height: 300px;
            min-height: 300px;
            flex: none;
          }

          :global(.register-wall-columns) {
            padding: 0 12px;
            gap: 12px;
          }

          .register-wall-caption {
            left: 5%;
            right: 5%;
            bottom: 5%;
          }

          .register-wall-caption h1 {
            font-size: 2rem;
          }

          .register-wall-caption p {
            font-size: 12px;
            margin-top: 10px;
          }

          .register-wall-brand {
            margin-top: 20px;
          }

          .register-form-panel {
            width: 100%;
            min-height: auto;
            height: auto;
            padding: 25px 15px;
          }

          .register-card {
            width: 100%;
            max-width: 520px;
            padding: 30px 24px;
          }
        }

        @media (max-width: 480px) {
          .register-card {
            padding: 25px 20px;
            border-radius: 22px;
          }

          .register-header h2 {
            font-size: 35px;
          }

          .register-role-badges span {
            padding: 7px 12px;
          }
        }
      `}</style>

      <div className="register-container">
        <section className="register-wall">
          <BookWall />

          <div className="register-wall-overlay" />

          <div className="register-wall-caption">
            <h1>
              Your next chapter
              <br />
              starts <span>here.</span>
            </h1>

            <p>
              Discover stories, find your next favorite book,
              and become part of the BOOKLYN community.
            </p>

            <div className="register-wall-brand">
              <span className="brand-line" />
              <span>BOOKLYN</span>
              <span className="brand-line" />
            </div>
          </div>
        </section>

        <section className="register-form-panel">
          <div className="register-card">
            <div className="register-header">
              <BookMascot
                passwordFocused={passwordFocused}
                showPassword={showPassword}
                mousePosition={mousePosition}
              />

              <p className="welcome">WELCOME TO BOOKLYN</p>

              <h2>Create Account</h2>

              <p
                style={{
                  color: "#a7a0c3",
                  fontSize: 12,
                  marginTop: 10,
                }}
              >
                Join our library community.
              </p>


              <form action={handleRegister}>
                {/* NAMA */}
                <div className="register-field">
                  <label htmlFor="nama">Nama Lengkap *</label>

                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    placeholder="Nama lengkap"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>

                {/* EMAIL */}
                <div className="register-field">
                  <label htmlFor="email">
                    Email Kampus (.ac.id) *
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="nama@kampus.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    autoComplete="email"
                    className={
                      emailTouched && email
                        ? emailIsValid
                          ? "valid"
                          : "invalid"
                        : ""
                    }
                    required
                  />

                  {emailHasError && (
                    <p className="register-field-message error">
                      Gunakan email kampus dengan domain .ac.id.
                    </p>
                  )}

                  {emailTouched && emailIsValid && (
                    <p className="register-field-message success">
                      Format email valid.
                    </p>
                  )}
                </div>

                {/* NIM */}
                <div className="register-field">
                  <label htmlFor="nim">
                    Nomor Identitas / NIM *
                  </label>

                  <input
                    id="nim"
                    name="nomor_identitas"
                    type="text"
                    inputMode="text"
                    placeholder="Masukkan NIM"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    onBlur={() => setNimTouched(true)}
                    autoComplete="off"
                    className={
                      nimTouched && nim
                        ? nimIsValid
                          ? "valid"
                          : "invalid"
                        : ""
                    }
                    required
                  />

                  {nimHasError && (
                    <p className="register-field-message error">
                      Nomor identitas harus berupa angka.
                    </p>
                  )}
                </div>

                {/* ALAMAT */}
                <div className="register-field">
                  <label htmlFor="alamat">Alamat (opsional)</label>

                  <textarea
                    id="alamat"
                    name="alamat"
                    rows="2"
                    placeholder="Alamat tempat tinggal"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                  />
                </div>

                {/* PASSWORD */}
                <div className="register-field">
                  <label htmlFor="password">Password *</label>

                  <div className="password-input-wrapper">
                    <input
                      ref={passwordRef}
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimal 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {password && (
                    <div className="password-strength">
                      <div className="password-strength-bars">
                        {[1, 2, 3, 4].map((bar) => (
                          <span
                            key={bar}
                            className={
                              passwordStrength >= bar ? "active" : ""
                            }
                            style={{
                              "--strength-color":
                                strengthColors[passwordStrength],
                            }}
                          />
                        ))}
                      </div>

                      <p className="password-strength-label">
                        Kekuatan password: {strengthText}
                      </p>
                    </div>
                  )}
                </div>

                {/* KONFIRMASI PASSWORD */}
                <div className="register-field">
                  <label htmlFor="confirmPassword">
                    Konfirmasi Password *
                  </label>

                  <div className="password-input-wrapper">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={
                        showConfirmPassword
                          ? "Sembunyikan konfirmasi password"
                          : "Tampilkan konfirmasi password"
                      }
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  {confirmPassword && (
                    <p
                      className={`register-field-message ${
                        password === confirmPassword
                          ? "success"
                          : "error"
                      }`}
                    >
                      {password === confirmPassword
                        ? "Password cocok."
                        : "Password belum cocok."}
                    </p>
                  )}
                </div>

                {/* ERROR */}
                {error && (
                  <div role="alert" className="register-message error">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {success && (
                  <div role="status" className="register-message success">
                    {success}
                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="register-submit"
                >
                  {loading
                    ? "Mendaftarkan akun..."
                    : "Daftar sebagai Mahasiswa"}
                </button>
              </form>
            </div>

            <div className="register-divider">
              <span>atau</span>
            </div>

        <Link
  href="/"
  className="register-guest"
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: "14px 20px",
    border: "1px solid #655a86",
    borderRadius: "40px",
    backgroundColor: "#302957",
    color: "#f5f0e8",
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "700",
    textDecoration: "none",
    boxSizing: "border-box",
  }}
>
  Continue as Guest
</Link>

            <p className="register-footer">
              Sudah punya akun?{" "}
              <Link href="/login">Masuk</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}