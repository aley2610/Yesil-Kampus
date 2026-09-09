import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIrgMhqEE-4Qe3m8dlxSqA5J9GoXR-JTA",
  authDomain: "yesilkampus-iuc.firebaseapp.com",
  projectId: "yesilkampus-iuc",
  storageBucket: "yesilkampus-iuc.firebasestorage.app",
  messagingSenderId: "555123910788",
  appId: "1:555123910788:web:2965b070f132129e853ad1"
};

// Çakışmayı önleyen güvenli başlatma
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// =========================================
// 1. KESİN GÜVENLİK DUVARI
// =========================================
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes("index.html") || currentPath.includes("kayit.html") || currentPath.endsWith("/");

    if (user) {
        if (localStorage.getItem("isRegistering") === "true") return; // Kayıt olurken fırlatma

        const gercekKullanici = user.displayName || user.email.split('@')[0];
        localStorage.setItem("kampusUser", gercekKullanici);

        if (isAuthPage) {
            window.location.href = "anasayfa.html";
        } else {
            const welcomeText = document.getElementById("welcomeName");
            if (welcomeText) welcomeText.innerText = `Merhaba, ${gercekKullanici}! 👋`;
        }
    } else {
        localStorage.removeItem("kampusUser");
        if (!isAuthPage) {
            window.location.href = "index.html";
        }
    }
});

// =========================================
// 2. GİRİŞ, KAYIT VE ÇIKIŞ (HAYAT KURTARAN EVENT DELEGATION)
// =========================================
document.addEventListener("click", (e) => {
    
    // 🚪 ÇIKIŞ YAP (Nereye tıklarsan tıkla yakalar!)
    const logoutBtn = e.target.closest(".logout") || e.target.closest(".logout-btn");
    if (logoutBtn) {
        e.preventDefault(); 
        localStorage.clear(); // Bütün yerel hafızayı tertemiz yap!
        signOut(auth).then(() => {
            window.location.href = "index.html";
        }).catch(() => {
            window.location.href = "index.html";
        });
        return;
    }

    // 🔑 GİRİŞ YAP
    if (e.target.id === "loginBtn") {
        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value.trim();

        if (!email || !password) {
            alert("Lütfen mail ve şifreni gir bebeğim!");
            return;
        }

        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                alert("Giriş Başarısız! Şifren veya mailin yanlış.");
            });
        return;
    }

    // 📝 KAYIT OL
    if (e.target.id === "registerBtn") {
        const email = document.getElementById("regEmail")?.value.trim();
        const username = document.getElementById("regUsername")?.value.trim();
        const password = document.getElementById("regPassword")?.value.trim();
        const passwordConfirm = document.getElementById("regPasswordConfirm")?.value.trim();

        if (!email || !username || !password) {
            alert("Lütfen tüm alanları doldur!");
            return;
        }

        if (!email.endsWith("@ogr.iuc.edu.tr") && !email.endsWith("@iuc.edu.tr")) {
            alert("Sadece @ogr.iuc.edu.tr veya @iuc.edu.tr uzantılı İÜC mailinle kayıt olabilirsin!");
            return;
        }

        if (password !== passwordConfirm) {
            alert("Şifreler uyuşmuyor!");
            return;
        }

        localStorage.clear();
        localStorage.setItem("isRegistering", "true");

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                return updateProfile(userCredential.user, { displayName: username });
            })
            .then(() => {
                return auth.signOut();
            })
            .then(() => {
                localStorage.removeItem("isRegistering");
                alert("🎉 Kayıt Başarılı! Yeni hesabınla giriş yapabilirsin.");
                window.location.href = "index.html";
            })
            .catch((error) => {
                localStorage.removeItem("isRegistering");
                alert("Kayıt Başarısız: Bu mail alınmış veya şifre çok kısa.");
            });
        return;
    }
});