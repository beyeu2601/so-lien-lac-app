import { useState, useRef, type ChangeEvent } from "react";
import CanvasEditor, { type FormData, type CanvasEditorRef } from "./components/CanvasEditor";

const getTodayDateString = () => {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

function App() {
  const [formData, setFormData] = useState<FormData>({
    session: "",
    date: getTodayDateString(),
    teacher: "",
    tutor: "",
    content: "",
    comments: "",
    homework: "",
  });

  const canvasRef = useRef<CanvasEditorRef>(null);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      canvasRef.current.download();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center lg:text-left">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Trợ Lý Điền Sổ Liên Lạc Tự Động
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Dùng duy nhất phôi chuẩn và font chữ luyện viết tiểu học HP001.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cột Form nhập liệu */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 pb-2 border-b">
              Thông Tin Sổ Liên Lạc
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Buổi</label>
                  <input
                    type="text"
                    name="session"
                    value={formData.session}
                    onChange={handleChange}
                    placeholder="Ví dụ: 12"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nội dung (Mỗi ý 1 dòng, tự động gạch đầu dòng)
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Học bài mới...&#10;Làm bài tập..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nhận xét (Mỗi ý 1 dòng, tự động gạch đầu dòng)
                </label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Con học tốt...&#10;Cần cố gắng thêm..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bài tập về nhà
                </label>
                <textarea
                  name="homework"
                  value={formData.homework}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Làm bài tập trang 12..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-none outline-none"
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
