// Kısa isim yerine doğrudan Firebase CDN bağlantısını kullanıyoruz
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

document.getElementById("publishBtn").addEventListener("click", async () => {
  const title = document.getElementById("taskTitle").value;
  const desc = document.getElementById("taskDesc").value;
  const points = parseInt(document.getElementById("ecoPoints").value);

  // 1. Eski aktif görevleri bul ve yayından kaldır (isActive: false)
  const q = query(collection(db, "WeeklyTasks"), where("isActive", "==", true));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach(async (taskDoc) => {
    const taskRef = doc(db, "WeeklyTasks", taskDoc.id);
    await updateDoc(taskRef, { isActive: false });
  });

  // 2. Yeni görevi sisteme ekle
  await addDoc(collection(db, "WeeklyTasks"), {
    title: title,
    description: desc,
    ecoPoints: points,
    isActive: true,
    dateAdded: new Date()
  });

  alert("Yeni görev başarıyla Yeşil Kampüs akışına eklendi!");
  
  // Formu temizle
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDesc").value = "";
  document.getElementById("ecoPoints").value = "";
});