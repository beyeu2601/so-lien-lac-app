import { useState, useRef, type ChangeEvent } from "react";
import CanvasEditor, { type FormData, type CanvasEditorRef } from "./components/CanvasEditor";

const getTodayDateString = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const FONTS = [
  { name: "HP001_5_hang_bold", label: "HP001 5 Hàng Bold (Khuyên dùng)" },
  { name: "HP001_5_hang_normal", label: "HP001 5 Hàng Normal" },
  { name: "HP001_4_hang_bold", label: "HP001 4 Hàng Bold" },
  { name: "HP001_4_hang_normal", label: "HP001 4 Hàng Normal" },
  { name: "HLHOCTRO", label: "HL Học Trò (Nét thanh thoát)" },
  { name: "Arial", label: "Arial (Cơ bản - Không chân)" },
  { name: "Times New Roman", label: "Times New Roman (Cơ bản - Có chân)" },
  { name: "Tahoma", label: "Tahoma (Cơ bản - Tròn trịa)" },
  { name: "Caveat", label: "Caveat (Viết tay Google)" },
  { name: "Dancing Script", label: "Dancing Script (Viết tay Google)" },
  { name: "Patrick Hand", label: "Patrick Hand (Viết tay Google)" },
];

function VoiceInputButton({ isListening, onStart }: { isListening: boolean; onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors border ${
        isListening
          ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
      }`}
      title="Nhập bằng giọng nói"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
      </svg>
      {isListening ? "Đang nghe..." : "Giọng nói"}
    </button>
  );
}

const capitalizeSentences = (text: string) => {
  return text.replace(/(^[^a-zA-ZÀ-ỹ]*|[\.\!\?]\s+)([a-zà-ỹ])/gm, (match, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
};

function App() {
  const [formData, setFormData] = useState<FormData>({
    studentName: "",
    session: "",
    date: getTodayDateString(),
    teacher: "",
    tutor: "",
    content: "",
    comments: "",
    homework: "",
  });

  const [fontFamily, setFontFamily] = useState(FONTS[0].name);
  const [fontColor, setFontColor] = useState("#0f1b81");
  const [listeningField, setListeningField] = useState<string | null>(null);

  const canvasRef = useRef<CanvasEditorRef>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let newValue = value;
    if (["content", "comments", "homework"].includes(name)) {
      newValue = capitalizeSentences(newValue);
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      canvasRef.current.download();
    }
  };

  const startVoiceDictation = (fieldName: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt hoặc thiết bị của bạn không hỗ trợ tính năng này của web.\n\nMẸO: Trên điện thoại, bạn hãy bấm vào ô nhập chữ, rồi dùng nút Micro 🎤 có sẵn trên BÀN PHÍM ẢO của máy để đọc chính tả. Cách này sẽ mượt và chính xác hơn rất nhiều!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    
    recognition.onstart = () => {
      setListeningField(fieldName);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData((prev) => {
        const current = prev[fieldName as keyof FormData];
        const prefix = current ? current + "\n- " : "- ";
        return { ...prev, [fieldName]: capitalizeSentences(prefix + transcript) };
      });
    };
    
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        alert("Vui lòng cấp quyền sử dụng Micro cho trình duyệt để dùng tính năng này.");
      } else if (event.error === "network") {
        alert("Lỗi kết nối mạng khi nhận diện giọng nói.");
      } else if (event.error === "no-speech") {
        alert("Không nghe thấy âm thanh. Vui lòng nói to hơn.");
      } else {
        alert("Lỗi nhận diện giọng nói: " + event.error + ". Mẹo: Trên điện thoại, bạn nên dùng nút Micro tích hợp sẵn trên bàn phím ảo sẽ mượt hơn rất nhiều.");
      }
      setListeningField(null);
    };
    
    recognition.onend = () => {
      setListeningField(null);
    };
    
    recognition.start();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Trợ Lý Điền Sổ Liên Lạc Tự Động
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Dùng duy nhất phôi chuẩn và tùy chọn font chữ luyện viết tiểu học của bạn.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột Form nhập liệu */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Cấu Hình Chung
              </h2>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chọn Phông Chữ Luyện Viết
              </label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none bg-white text-sm"
              >
                {FONTS.map((font) => (
                  <option key={font.name} value={font.name}>
                    {font.label}
                  </option>
                ))}
              </select>

              <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                Chọn Màu Mực
              </label>
              <div className="flex gap-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" className="w-4 h-4 text-blue-800 accent-blue-800" name="fontColor" value="#0f1b81" checked={fontColor === "#0f1b81"} onChange={(e) => setFontColor(e.target.value)} />
                  <span className="ml-2 text-sm text-gray-800 font-medium">Xanh (Bút bi)</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" className="w-4 h-4 text-black accent-black" name="fontColor" value="#111111" checked={fontColor === "#111111"} onChange={(e) => setFontColor(e.target.value)} />
                  <span className="ml-2 text-sm text-gray-800 font-medium">Đen</span>
                </label>
                <label className="inline-flex items-center cursor-pointer">
                  <input type="radio" className="w-4 h-4 text-red-600 accent-red-600" name="fontColor" value="#d10000" checked={fontColor === "#d10000"} onChange={(e) => setFontColor(e.target.value)} />
                  <span className="ml-2 text-sm text-gray-800 font-medium">Đỏ</span>
                </label>
              </div>
            </div>

            <h2 className="text-xl font-semibold text-gray-800 pb-2 border-b">
              Thông Tin Sổ Liên Lạc
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên học viên</label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleChange}
                  placeholder="Tên học viên"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm font-medium text-blue-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buổi</label>
                  <input
                    type="text"
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    placeholder="Ví dụ: 12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
                  <input
                    type="text"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    placeholder="10/08/2026"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giảng viên</label>
                <input
                  type="text"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleChange}
                  placeholder="Tên giảng viên"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trợ giảng</label>
                <input
                  type="text"
                  name="tutor"
                  value={formData.tutor}
                  onChange={handleChange}
                  placeholder="Tên trợ giảng"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nội dung (Mỗi ý 1 dòng)
                  </label>
                  <VoiceInputButton
                    isListening={listeningField === "content"}
                    onStart={() => startVoiceDictation("content")}
                  />
                </div>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Học bài mới...&#10;Làm bài tập..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none outline-none text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Nhận xét (Mỗi ý 1 dòng)
                  </label>
                  <VoiceInputButton
                    isListening={listeningField === "comments"}
                    onStart={() => startVoiceDictation("comments")}
                  />
                </div>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Con học tốt...&#10;Cần cố gắng thêm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none outline-none text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Bài tập về nhà
                  </label>
                  <VoiceInputButton
                    isListening={listeningField === "homework"}
                    onStart={() => startVoiceDictation("homework")}
                  />
                </div>
                <textarea
                  name="homework"
                  value={formData.homework}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Làm bài tập trang 12..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Cột Preview ảnh */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6 items-center">
              <div className="flex justify-between items-center border-b pb-2 w-full">
                <h2 className="text-xl font-semibold text-gray-800">
                  Xem Trước Kết Quả
                </h2>
                <div className="flex flex-col items-end">
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Tải Ảnh Xuống
                  </button>
                  <span className="text-[10px] text-gray-400 mt-1 block text-right max-w-[200px]">
                    (Trên ĐT: bấm nút để chia sẻ hoặc nhấn giữ ảnh dưới để lưu)
                  </span>
                </div>
              </div>

              <CanvasEditor
                ref={canvasRef}
                data={formData}
                fontFamily={fontFamily}
                fontColor={fontColor}
              />
              <p className="text-xs text-gray-400 text-center mt-2">
                * Trên điện thoại: Nhấn giữ vào hình ảnh trên và chọn <strong>"Lưu vào ảnh" (Save to Photos)</strong> để lưu trực tiếp vào thư viện máy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
