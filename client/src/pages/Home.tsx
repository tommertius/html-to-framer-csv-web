import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Image as ImageIcon, Loader2, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [conversionResult, setConversionResult] = useState<{
    csvContent: string;
    fileName: string;
    preview: {
      title: string;
      category: string;
      readingTime: string;
    };
  } | null>(null);

  const convertMutation = trpc.converter.convert.useMutation({
    onSuccess: (data) => {
      setConversionResult(data);
      toast.success("CSV gegenereerd!", {
        description: "Je kunt het bestand nu downloaden."
      });
    },
    onError: (error) => {
      toast.error("Conversie mislukt", {
        description: error.message
      });
    }
  });

  const handleHtmlFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHtmlFile(file);
      const content = await file.text();
      setHtmlContent(content);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setIsUploading(true);
      
      try {
        // Upload image to get URL
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await response.json();
        setImageUrl(data.url);
        toast.success("Afbeelding geüpload");
      } catch (error) {
        toast.error("Upload mislukt", {
          description: error instanceof Error ? error.message : "Probeer opnieuw"
        });
        setImageFile(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleConvert = () => {
    if (!htmlContent || !imageUrl) {
      toast.error("Beide bestanden zijn vereist", {
        description: "Upload zowel een HTML bestand als een afbeelding."
      });
      return;
    }

    convertMutation.mutate({
      htmlContent,
      imageUrl,
      useAI: true
    });
  };

  const handleReset = () => {
    setHtmlFile(null);
    setImageFile(null);
    setHtmlContent("");
    setImageUrl("");
    setConversionResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl overflow-hidden border-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">HTML naar Framer CSV</h1>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!conversionResult ? (
            <>
              {/* HTML File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Artikel
                </label>
                <label
                  htmlFor="html-upload"
                  className={`
                    flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer
                    transition-all hover:border-gray-400 hover:bg-gray-50
                    ${htmlFile ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${htmlFile ? 'bg-blue-500' : 'bg-gray-100'}
                  `}>
                    {htmlFile ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Upload className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${htmlFile ? 'text-blue-700' : 'text-gray-600'}`}>
                      {htmlFile ? htmlFile.name : 'Upload HTML bestand'}
                    </p>
                    {!htmlFile && (
                      <p className="text-xs text-gray-400">Google Docs export (.html)</p>
                    )}
                  </div>
                </label>
                <input
                  id="html-upload"
                  type="file"
                  accept=".html"
                  onChange={handleHtmlFileChange}
                  className="hidden"
                />
              </div>

              {/* Image File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Afbeelding
                </label>
                <label
                  htmlFor="image-upload"
                  className={`
                    flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer
                    transition-all hover:border-gray-400 hover:bg-gray-50
                    ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${imageFile ? 'bg-blue-500' : 'bg-gray-100'}
                  `}>
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : imageFile ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${imageFile ? 'text-blue-700' : 'text-gray-600'}`}>
                      {imageFile ? imageFile.name : 'Upload afbeelding'}
                    </p>
                    {!imageFile && (
                      <p className="text-xs text-gray-400">JPG, PNG of WebP</p>
                    )}
                  </div>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>

              {/* Convert Button */}
              <Button
                onClick={handleConvert}
                disabled={!htmlFile || !imageFile || convertMutation.isPending}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium text-sm transition-all"
              >
                {convertMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Converteren...
                  </>
                ) : (
                  'Genereer CSV'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  CSV Gegenereerd!
                </h2>
                <div className="space-y-1 text-sm text-gray-600 mb-6">
                  <p><span className="font-medium">Titel:</span> {conversionResult.preview.title}</p>
                  <p><span className="font-medium">Categorie:</span> {conversionResult.preview.category}</p>
                  <p><span className="font-medium">Leestijd:</span> {conversionResult.preview.readingTime}</p>
                </div>
              </div>

              {/* Download Button */}
              <Button 
                onClick={() => {
                  const blob = new Blob([conversionResult.csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = conversionResult.fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
                className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium text-sm transition-all"
              >
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>

              {/* Reset Button */}
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full h-12 rounded-xl font-medium text-sm"
              >
                Nieuwe Conversie
              </Button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            Converteer HTML artikelen naar Framer CMS-compatibele CSV bestanden
          </p>
        </div>
      </Card>
    </div>
  );
}
