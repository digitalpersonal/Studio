
/**
 * ImageService: Utilitário de alta performance para compressão de imagens.
 * Otimiza o tamanho do arquivo para armazenamento em banco de dados mantendo
 * a fidelidade visual para diagnósticos posturais.
 */
export const ImageService = {
  /**
   * Comprime uma imagem para JPEG com dimensões máximas e qualidade controlada.
   * @param file O arquivo original vindo do input ou câmera.
   * @param maxWidth Largura máxima permitida (default 1200px).
   * @param quality Qualidade da compressão de 0 a 1 (default 0.6).
   */
  compressImage: (file: File, maxWidth: number = 1200, quality: number = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onerror = (error) => reject(error);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcula proporções mantendo o aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width *= maxWidth / height;
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject("Não foi possível obter contexto do Canvas");

          // Preenche fundo branco (essencial para converter PNG transparente para JPEG)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // Desenha a imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);

          // Exporta como base64 em formato JPEG otimizado
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        
        img.onerror = () => reject("Erro ao carregar objeto de imagem");
      };
    });
  }
};
