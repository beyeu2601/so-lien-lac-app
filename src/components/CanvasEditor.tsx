import { useEffect, useRef, useState, type ForwardedRef, forwardRef, useImperativeHandle } from "react";

export interface FormData {
  session: string;
  date: string;
  teacher: string;
  tutor: string;
  content: string;
  comments: string;
  homework: string;
}

interface CanvasEditorProps {
  data: FormData;
  fontFamily: string;
}

export interface CanvasEditorRef {
  download: () => void;
  isReady: boolean;
}

// Hệ tọa độ chuẩn xác dựa trên phân tích ảnh phôi:
// - Baseline bottom cho các trường trên dòng kẻ chấm
// - Baseline top cho các trường textarea bên dưới
const CONFIG = {
  color: "#0f1b81", // Màu xanh mực bút bi thực tế
  fields: {
    // Dòng kẻ chấm Buổi / Ngày ở Y=342 (baseline=344)
    session: { x: 330, y: 344, maxWidth: 150, fontSize: 36 },
    date: { x: 730, y: 344, maxWidth: 240, fontSize: 36 },
    // Dòng kẻ chấm Giảng viên ở Y=413 (baseline=415)
    teacher: { x: 430, y: 415, maxWidth: 570, fontSize: 36 },
    // Dòng kẻ chấm Trợ giảng ở Y=484 (baseline=486)
    tutor: { x: 450, y: 486, maxWidth: 550, fontSize: 36 },
    
    // NỘI DUNG (Y=565) -> Khoảng trắng bắt đầu từ 600
    content: { x: 110, y: 600, width: 860, height: 170, fontSize: 34, lineGap: 14 },
    // NHẬN XÉT (Y=800) -> Khoảng trắng bắt đầu từ 830
    comments: { x: 110, y: 830, width: 860, height: 170, fontSize: 34, lineGap: 14 },
    // BÀI TẬP VỀ NHÀ (Y=1037) -> Khoảng trắng bắt đầu từ 1070
    homework: { x: 110, y: 1070, width: 860, height: 230, fontSize: 34, lineGap: 14 },
  },
};

const CanvasEditor = forwardRef(function CanvasEditor(
  { data, fontFamily }: CanvasEditorProps,
  ref: ForwardedRef<CanvasEditorRef>
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [imgDataUrl, setImgDataUrl] = useState<string>("");

  // Chờ load font viết chữ đẹp đang được chọn
  useEffect(() => {
    setFontLoaded(false);
    
    if (document.fonts.check(`12px "${fontFamily}"`)) {
      setFontLoaded(true);
      return;
    }

    const loadFont = async () => {
      try {
        await document.fonts.load(`12px "${fontFamily}"`);
        setFontLoaded(true);
      } catch (err) {
        console.error(`Lỗi tải font ${fontFamily}:`, err);
        setFontLoaded(true); // Fallback
      }
    };
    loadFont();
  }, [fontFamily]);

  // Tải phôi ảnh mặc định duy nhất (thêm timestamp để tránh cache trình duyệt)
  useEffect(() => {
    const img = new Image();
    img.src = "/templates/so-lien-lac-template.png?t=" + Date.now();
    img.onload = () => setImageLoaded(img);
    img.onerror = () => {
      console.error("Không thể tải phôi ảnh mặc định tại public/templates/so-lien-lac-template.png");
    };
  }, []);

  // Vẽ Canvas
  useEffect(() => {
    if (!fontLoaded || !imageLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imageLoaded.width;
    canvas.height = imageLoaded.height;

    // Vẽ ảnh nền
    ctx.drawImage(imageLoaded, 0, 0);

    ctx.fillStyle = CONFIG.color;

    // Hàm vẽ chữ đơn giản (Buổi, Ngày, Giảng viên, Trợ giảng) đặt NGAY TRÊN dòng kẻ chấm
    const drawSimpleText = (text: string, field: "session" | "date" | "teacher" | "tutor") => {
      const cfg = CONFIG.fields[field];
      ctx.textBaseline = "bottom"; // Giúp chữ nằm vừa khít lên dòng chấm
      ctx.font = `${cfg.fontSize}px "${fontFamily}"`;
      ctx.fillText(text, cfg.x, cfg.y, cfg.maxWidth);
    };

    drawSimpleText(data.session, "session");
    drawSimpleText(data.date, "date");
    drawSimpleText(data.teacher, "teacher");
    drawSimpleText(data.tutor, "tutor");

    // Hàm vẽ đoạn văn bản nhiều dòng (Nội dung, Nhận xét, Bài tập)
    const drawMultilineText = (
      text: string,
      field: "content" | "comments" | "homework",
      addBullets = false
    ) => {
      const cfg = CONFIG.fields[field];
      if (!text.trim()) return;

      ctx.textBaseline = "top"; // Trả lại baseline top cho khối văn bản
      let currentFontSize = cfg.fontSize;
      let lines: string[] = [];

      // Xử lý xuống dòng & tự động thêm gạch đầu dòng
      const rawLines = text.split("\n").filter((l) => l.trim() !== "");
      let processedText = text;

      if (addBullets) {
        processedText = rawLines
          .map((l) => {
            const trimmed = l.trim();
            if (trimmed.startsWith("-") || trimmed.startsWith("+") || trimmed.startsWith("*")) {
              return trimmed;
            }
            return `- ${trimmed}`;
          })
          .join("\n");
      }

      // Hàm tính toán bẻ dòng
      const calculateLines = (fontSize: number) => {
        ctx.font = `${fontSize}px "${fontFamily}"`;
        const calculatedLines: string[] = [];
        const paragraphs = processedText.split("\n");

        paragraphs.forEach((p) => {
          let currentLine = "";
          const words = p.split(" ");

          for (let i = 0; i < words.length; i++) {
            const testLine = currentLine + words[i] + " ";
            const metrics = ctx.measureText(testLine);
            if (metrics.width > cfg.width && i > 0) {
              calculatedLines.push(currentLine);
              currentLine = words[i] + " ";
            } else {
              currentLine = testLine;
            }
          }
          calculatedLines.push(currentLine);
        });
        return calculatedLines;
      };

      // Tự động thu nhỏ font size nếu nội dung quá nhiều (không bị viết tràn lan)
      while (currentFontSize > 12) {
        lines = calculateLines(currentFontSize);
        const totalHeight = lines.length * (currentFontSize + cfg.lineGap);
        if (totalHeight <= cfg.height) break;
        currentFontSize -= 2;
      }

      // Thực thi vẽ lên Canvas
      ctx.font = `${currentFontSize}px "${fontFamily}"`;
      let cursorY = cfg.y;
      lines.forEach((line) => {
        ctx.fillText(line.trim(), cfg.x, cursorY);
        cursorY += currentFontSize + cfg.lineGap;
      });
    };

    drawMultilineText(data.content, "content", true);
    drawMultilineText(data.comments, "comments", true);
    drawMultilineText(data.homework, "homework", false);

    // Export ra DataURL để hiển thị thẻ <img> hỗ trợ lưu trực tiếp trên điện thoại
    setImgDataUrl(canvas.toDataURL("image/jpeg", 0.9));

  }, [data, fontLoaded, imageLoaded, fontFamily]);

  useImperativeHandle(ref, () => ({
    download: async () => {
      if (!canvasRef.current || !imageLoaded) return;
      const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
      const filename = `So-Lien-Lac-${data.date.replace(/\//g, "-") || "moi"}.jpg`;

      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: "image/jpeg" });
        
        // Sử dụng Web Share API trên điện thoại để mở menu chia sẻ/lưu trực tiếp vào Album
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Sổ Liên Lạc",
          });
          return;
        }
      } catch (err) {
        console.error("Web Share API error, falling back to direct download:", err);
      }

      // Fallback cho Desktop
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    },
    isReady: !!imageLoaded,
  }));

  if (!imageLoaded) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500 text-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 min-h-[400px]">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-lg font-medium">Đang tải phôi ảnh...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden border border-gray-200 rounded-xl shadow-sm bg-white max-w-[550px] flex flex-col items-center">
      {/* Canvas ẩn đi, chỉ dùng để vẽ */}
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
      />
      {/* Hiển thị thẻ <img> thật để người dùng mobile có thể đè ngón tay lưu trực tiếp vào Photos */}
      {imgDataUrl ? (
        <img
          src={imgDataUrl}
          className="w-full h-auto block select-none"
          alt="Xem trước Sổ Liên Lạc"
        />
      ) : (
        <div className="p-8 text-gray-500">Đang khởi tạo bản xem trước...</div>
      )}
    </div>
  );
});

export default CanvasEditor;
