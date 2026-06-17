import { supabase } from '@/integrations/supabase/client';

export async function uploadToGoogleDrive(file: File, folderName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64Data = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke('gdrive-upload', {
          body: {
            fileName: file.name,
            fileContentBase64: base64Data,
            mimeType: file.type,
            folderName: folderName,
          }
        });

        if (error) throw error;
        if (!data.success) throw new Error(data.error || 'Upload failed');

        // Return the Google Drive link
        resolve(data.webViewLink);
      } catch (err) {
        console.error('Error uploading to GDrive:', err);
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
  });
}
