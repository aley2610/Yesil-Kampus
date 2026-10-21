import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, updateProfile, signOut, sendPasswordResetEmail, sendEmailVerification } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
// 2. GİRİŞ, KAYIT, ÇIKIŞ VE ŞİFRE SIFIRLAMA (TEK MERKEZDEN YÖNETİM)
// =========================================
document.addEventListener("click", async (e) => {    
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

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // 🌟 Kullanıcının maili doğrulanmamışsa girişi engelle
            if (!userCredential.user.emailVerified) {
                await auth.signOut(); // Hemen çıkış yaptır
                alert("Giriş başarısız! E-posta adresini henüz doğrulamadın. Lütfen mailine gelen doğrulama linkine tıkla. 📩");
                return;
            }
        } catch (error) {
            alert("Giriş Başarısız! Şifren veya mailin yanlış.");
        }
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

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });
            
            // 🌟 Doğrulama mailini gönderiyoruz
            await sendEmailVerification(userCredential.user);
            
            await auth.signOut();
            localStorage.removeItem("isRegistering");
            alert("🎉 Kayıt Başarılı! Ancak giriş yapabilmek için okul e-postana gönderilen linke tıklayarak hesabını doğrulamalısın. (Spam klasörüne bakmayı unutma!) 🌿");
            window.location.href = "index.html";
        } catch (error) {
            localStorage.removeItem("isRegistering");
            alert("Kayıt Başarısız: Bu mail alınmış veya şifre çok kısa.");
        }
        return;
    }

    // 🔄 ŞİFREMİ UNUTTUM
    if (e.target.id === "forgotPasswordBtn") {
        e.preventDefault(); // Sayfanın yenilenmesini engelle
    
        // E-posta kutusuna yazılan maili al
        const email = document.getElementById("email")?.value.trim();

        if (!email) {
            alert("Aşkm, şifre sıfırlama linki gönderebilmemiz için önce e-posta adresini kutucuğa yazmalısın! 🌿");
            return;
        }

        // Sadece İÜC maillerine izin ver (Güvenlik)
        if (!email.endsWith("@ogr.iuc.edu.tr") && !email.endsWith("@iuc.edu.tr")) {
            alert("Sadece @ogr.iuc.edu.tr veya @iuc.edu.tr uzantılı mailler için şifre sıfırlanabilir!");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            alert("🎉 Şifre sıfırlama linki mailine gönderildi! Lütfen gelen kutunu (veya spam klasörünü) kontrol et.");
        } catch (error) {
            console.error("Firebase Şifre Sıfırlama Hatası:", error);
            
            if (error.code === 'auth/user-not-found') {
                alert("Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.");
            } else if (error.code === 'auth/invalid-email') {
                alert("Geçersiz bir e-posta adresi formatı.");
            } else {
                alert("Bir hata oluştu: Lütfen daha sonra tekrar dene.");
            }
        }
        return;
    }
});

// Sayfanın en üstünde olması gereken importlar
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Yeşil Kampüs aktif görevi gerçek zamanlı dinleme fonksiyonu
const q = query(collection(db, "WeeklyTasks"), where("isActive", "==", true));

onSnapshot(q, (snapshot) => {
  snapshot.forEach((doc) => {
    const task = doc.data();
    
    // HTML'deki yerlerine verileri yazdırıyoruz
    document.getElementById("active-task-title").innerText = "🌱 " + task.title;
    document.getElementById("active-task-desc").innerText = task.description;
    document.getElementById("active-task-points").innerText = "+" + task.ecoPoints + " YP";
    
    // Veri başarıyla gelince kutucuğu görünür yap
    document.getElementById("weekly-task-card").style.display = "block";
  });
});