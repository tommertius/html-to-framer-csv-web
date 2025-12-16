import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Image as ImageIcon, Loader2, Download, CheckCircle2, Edit3, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import JSZip from 'jszip';

type ConversionData = {
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  preview: string;
  category: string;
  date: string;
  readingTime: string;
  imageUrl: string;
  imageAlt: string;
  firstParagraph: string;
  content: string;
  sources: string;
};

export default function Home() {
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [conversionData, setConversionData] = useState<ConversionData | null>(null);
  const [editedData, setEditedData] = useState<ConversionData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDraggingHtml, setIsDraggingHtml] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressStep, setProgressStep] = useState<number>(0);

  const progressSteps = [
    { message: "✨ HTML ontleden...", duration: 800 },
    { message: "🎯 SEO magie toepassen...", duration: 2000 },
    { message: "🎨 Afbeelding analyseren...", duration: 1500 },
    { message: "📝 Meta velden genereren...", duration: 1200 },
    { message: "🔮 Keywords ontdekken...", duration: 1000 },
    { message: "📄 CSV samenstellen...", duration: 600 },
  ];

  const convertMutation = trpc.converter.convert.useMutation({
    onSuccess: (data) => {
      setConversionData(data.data);
      setEditedData(data.data);
      setShowPreview(true);
      toast.success("Conversie voltooid!", {
        description: "Bekijk en bewerk de velden voordat je download."
      });
    },
    onError: (error) => {
      toast.error("Conversie mislukt", {
        description: error.message
      });
    }
  });

  const extractHtmlFromZip = async (file: File): Promise<string> => {
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      // Find the first HTML file in the zip
      const htmlFile = Object.keys(contents.files).find(name => 
        name.toLowerCase().endsWith('.html') && !name.startsWith('__MACOSX')
      );
      
      if (!htmlFile) {
        throw new Error('Geen HTML bestand gevonden in de zip');
      }
      
      const htmlContent = await contents.files[htmlFile].async('text');
      return htmlContent;
    } catch (error) {
      throw new Error('Kon zip bestand niet uitpakken: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const processHtmlFile = async (file: File) => {
    setHtmlFile(file);
    try {
      let content: string;
      
      if (file.name.toLowerCase().endsWith('.zip')) {
        toast.info("Zip bestand uitpakken...");
        content = await extractHtmlFromZip(file);
        toast.success("HTML geëxtraheerd uit zip");
      } else {
        content = await file.text();
      }
      
      setHtmlContent(content);
    } catch (error) {
      toast.error("Fout bij verwerken bestand", {
        description: error instanceof Error ? error.message : "Probeer opnieuw"
      });
      setHtmlFile(null);
      setHtmlContent("");
    }
  };

  const handleHtmlFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processHtmlFile(file);
    }
  };

  const handleHtmlDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingHtml(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const isValidFile = file.name.toLowerCase().endsWith('.html') || 
                         file.name.toLowerCase().endsWith('.zip');
      if (isValidFile) {
        await processHtmlFile(file);
      } else {
        toast.error("Ongeldig bestandstype", {
          description: "Upload een .html of .zip bestand"
        });
      }
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImage(file);
    }
  };

  const handleImageDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDraggingImage(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      } else {
        toast.error("Ongeldig bestandstype", {
          description: "Upload een afbeelding (JPG, PNG, WebP)"
        });
      }
    }
  };

  const uploadImage = async (file: File) => {
    setImageFile(file);
    setIsUploading(true);
    
    try {
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
  };

  const handleConvert = async () => {
    if (!htmlContent || !imageUrl) {
      toast.error("Beide bestanden zijn vereist", {
        description: "Upload zowel een HTML bestand als een afbeelding."
      });
      return;
    }

    // Start progress animation
    setProgressStep(0);
    
    // Animate through progress steps continuously
    const animateProgress = async () => {
      let i = 0;
      while (true) {
        setProgressStep(i);
        setProgressMessage(progressSteps[i].message);
        await new Promise(resolve => setTimeout(resolve, progressSteps[i].duration));
        i = (i + 1) % progressSteps.length; // Loop back to start
      }
    };

    // Start animation and conversion in parallel
    animateProgress();
    
    convertMutation.mutate({
      htmlContent,
      imageUrl,
      useAI: true
    });
  };

  const generateCSVMutation = trpc.converter.generateCSV.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([data.csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV gedownload!");
    },
    onError: (error) => {
      toast.error("Download mislukt", {
        description: error.message
      });
    }
  });

  const handleDownload = () => {
    if (!editedData) return;
    generateCSVMutation.mutate(editedData);
  };

  const handleReset = () => {
    setHtmlFile(null);
    setImageFile(null);
    setHtmlContent("");
    setImageUrl("");
    setConversionData(null);
    setEditedData(null);
    setShowPreview(false);
  };

  const handleBack = () => {
    setShowPreview(false);
    setConversionData(null);
    setEditedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-xl rounded-2xl overflow-hidden border-0">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
          {showPreview && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            {showPreview ? (
              <Edit3 className="w-5 h-5 text-white" />
            ) : (
              <FileText className="w-5 h-5 text-white" />
            )}
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            {showPreview ? "Bekijk & Bewerk" : "HTML naar Framer CSV"}
          </h1>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showPreview ? (
            <div className="space-y-4">
              {/* HTML File Upload with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Artikel
                </label>
                <label
                  htmlFor="html-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingHtml(true);
                  }}
                  onDragLeave={() => setIsDraggingHtml(false)}
                  onDrop={handleHtmlDrop}
                  className={`
                    flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer
                    transition-all hover:border-gray-400 hover:bg-gray-50
                    ${htmlFile ? 'border-blue-500 bg-blue-50' : isDraggingHtml ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
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
                      {htmlFile ? htmlFile.name : 'Upload of sleep HTML bestand'}
                    </p>
                    {!htmlFile && (
                      <p className="text-xs text-gray-400">Google Docs export (.html) of .zip</p>
                    )}
                  </div>
                </label>
                <input
                  id="html-upload"
                  type="file"
                  accept=".html,.zip"
                  onChange={handleHtmlFileChange}
                  className="hidden"
                />
              </div>

              {/* Image File Upload with Drag & Drop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Afbeelding
                </label>
                <label
                  htmlFor="image-upload"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingImage(true);
                  }}
                  onDragLeave={() => setIsDraggingImage(false)}
                  onDrop={handleImageDrop}
                  className={`
                    flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer
                    transition-all hover:border-gray-400 hover:bg-gray-50
                    ${imageFile ? 'border-blue-500 bg-blue-50' : isDraggingImage ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}
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
                      {imageFile ? imageFile.name : 'Upload of sleep afbeelding'}
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
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">{progressMessage || 'Converteren...'}</span>
                    </div>
                  </div>
                ) : (
                  'Genereer CSV'
                )}
              </Button>
            </div>
          ) : editedData && (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">Titel</Label>
                  <Input
                    id="title"
                    value={editedData.title}
                    onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="slug" className="text-sm font-medium text-gray-700">Slug</Label>
                  <Input
                    id="slug"
                    value={editedData.slug}
                    onChange={(e) => setEditedData({ ...editedData, slug: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="metaTitle" className="text-sm font-medium text-gray-700">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={editedData.metaTitle}
                    onChange={(e) => setEditedData({ ...editedData, metaTitle: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription" className="text-sm font-medium text-gray-700">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={editedData.metaDescription}
                    onChange={(e) => setEditedData({ ...editedData, metaDescription: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="keywords" className="text-sm font-medium text-gray-700">Keywords</Label>
                  <Input
                    id="keywords"
                    value={editedData.keywords}
                    onChange={(e) => setEditedData({ ...editedData, keywords: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="preview" className="text-sm font-medium text-gray-700">Preview</Label>
                  <Textarea
                    id="preview"
                    value={editedData.preview}
                    onChange={(e) => setEditedData({ ...editedData, preview: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">Categorie</Label>
                    <Input
                      id="category"
                      value={editedData.category}
                      onChange={(e) => setEditedData({ ...editedData, category: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">Datum</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editedData.date}
                      onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="imageAlt" className="text-sm font-medium text-gray-700">Afbeelding Alt Text</Label>
                  <Input
                    id="imageAlt"
                    value={editedData.imageAlt}
                    onChange={(e) => setEditedData({ ...editedData, imageAlt: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t">
                <Button
                  onClick={handleDownload}
                  className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-xl font-medium text-sm transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </Button>

                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full h-12 rounded-xl font-medium text-sm"
                >
                  Nieuwe Conversie
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showPreview && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center">
              Converteer HTML artikelen naar Framer CMS-compatibele CSV bestanden
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
