import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, addDoc, setDoc, increment, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

let currentTaskId = null;
let basePoints = 10; 
let currentTaskTitle = "";
const user = localStorage.getItem("kampusUser") || "İÜC_Öğrencisi"; 

// 1. AKTİF GÖREVİ GETİR VE KİLİT DURUMUNU KONTROL ET
const q = query(collection(db, "WeeklyTasks"), where("isActive", "==", true));
onSnapshot(q, async (snapshot) => {
    snapshot.forEach(async (taskDoc) => {
        const task = taskDoc.data();
        currentTaskId = taskDoc.id;
        currentTaskTitle = task.title;
        
        document.getElementById("active-task-title").innerText = "🌱 " + task.title;
        document.getElementById("active-task-desc").innerText = task.description;

        const pointsBadge = document.getElementById("active-task-points");
        const cameraBtn = document.querySelector(".camera-btn");

        const completedQ = query(
            collection(db, "CompletedTasks"),
            where("username", "==", user),
            where("taskTitle", "==", task.title)
        );
        const completedSnap = await getDocs(completedQ);

        if (!completedSnap.empty) {
            cameraBtn.style.display = "none";
            pointsBadge.innerText = "✅ GÖREV TAMAMLANDI";
            pointsBadge.style.backgroundColor = "#5c704c"; 
            pointsBadge.style.color = "white";
        } else {
            cameraBtn.style.display = "flex";
            if (!task.firstSolver) {
                pointsBadge.innerText = "🏆 İLK TAMAMLAYANA 50 YP!";
                pointsBadge.style.backgroundColor = "#ff5722"; 
                pointsBadge.style.color = "white";
            } else {
                pointsBadge.innerText = "+" + basePoints + " YP";
                pointsBadge.style.backgroundColor = "#f4cc3a"; 
                pointsBadge.style.color = "#333";
            }
        }
    });
});

// YENİ ADIM: GEÇMİŞ GÖREVLERİ VERİTABANINDAN GERÇEK ZAMANLI ÇEKME
const pastTasksQ = query(collection(db, "CompletedTasks"), where("username", "==", user));
onSnapshot(pastTasksQ, (snapshot) => {
    const container = document.getElementById("past-tasks-container");
    
    if (snapshot.empty) {
        // Hiç görev yoksa boş uyarı mesajını göster
        container.innerHTML = `
            <p id="no-task-msg" style="grid-column: span 2; text-align: center; font-size: 13px; color: #666; padding: 20px 0;">
                Henüz tamamlanmış bir göreviniz bulunmuyor. İlk görevini tamamlamak için yukarıdaki kamerayı kullan! 🌱
            </p>`;
    } else {
        // Görevler varsa uyarıyı silip verileri tarihe göre sıralayarak ekrana bas
        let tasksArray = [];
        snapshot.forEach((doc) => {
            tasksArray.push(doc.data());
        });

        // En son yapılan görev en üstte görünsün diye tarihe göre ters sıralama (Firebase index hatasından kaçınmak için JS'de yapıyoruz)
        tasksArray.sort((a, b) => b.dateAdded.toDate() - a.dateAdded.toDate());

        let html = "";
        tasksArray.forEach((data) => {
            const isFirst = data.pointsEarned === 50;
            html += `
                <div class="past-task-item">
                    <img src="${data.photoUrl}" alt="Görev Foto">
                    <h4>${data.taskTitle}</h4>
                    <span style="color: ${isFirst ? '#ff5722' : '#5c704c'}">+${data.pointsEarned} YP ${isFirst ? '🏆' : ''}</span>
                </div>
            `;
        });
        container.innerHTML = html;
    }
});

// 2. GREEN UX: FOTOĞRAFI SIKIŞTIRMA FONKSİYONU
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const maxWidth = 400; 
            const scale = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6); 
            callback(compressedBase64);
        };
    };
}

// 3. FOTOĞRAF YÜKLEME VE PUAN HESAPLAMA
const cameraInput = document.getElementById("cameraInput");
cameraInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!currentTaskId) {
        alert("Aşkm aktif görev henüz yüklenmedi veya veritabanı erişimi yok. Sayfayı yenileyip tekrar dener misin? 🌱");
        return;
    }

    const btnSpan = document.querySelector(".camera-btn span");
    btnSpan.innerText = "⏳"; 
    
    compressImage(file, async (compressedImage) => {
        try {
            const taskRef = doc(db, "WeeklyTasks", currentTaskId);
            const taskSnap = await getDoc(taskRef);
            const taskData = taskSnap.data();

            let earnedPoints = basePoints; 
            let isFirst = false;

            if (!taskData.firstSolver) {
                earnedPoints = 50;
                isFirst = true;
                await updateDoc(taskRef, { firstSolver: user });
            }

            // A. Görevi tamamlananlar listesine ekle
            await addDoc(collection(db, "CompletedTasks"), {
                username: user,
                taskTitle: currentTaskTitle,
                photoUrl: compressedImage, 
                pointsEarned: earnedPoints,
                dateAdded: new Date()
            });

            // B. Toplam puanı güncelle
            const userRef = doc(db, "Users", user);
            await setDoc(userRef, {
                username: user,
                totalPoints: increment(earnedPoints) 
            }, { merge: true }); 

            // C. Butonu anında gizle ve rozeti değiştir
            const cameraBtn = document.querySelector(".camera-btn");
            const pointsBadge = document.getElementById("active-task-points");
            cameraBtn.style.display = "none";
            pointsBadge.innerText = "✅ GÖREV TAMAMLANDI";
            pointsBadge.style.backgroundColor = "#5c704c";
            pointsBadge.style.color = "white";

            alert(isFirst ? "HARİKA! GÖREVİ İLK SEN TAMAMLADIN VE 50 YP KAPTIN! 🏆" : `Tebrikler! Görevi tamamladın ve +${earnedPoints} YP kazandın! 🌱`);
            
        } catch (error) {
            console.error("Yükleme hatası:", error);
            alert("HATA DETAYI: " + error.message);
            btnSpan.innerText = "📸";
        }
    });
});