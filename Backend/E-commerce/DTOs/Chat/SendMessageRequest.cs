using System.ComponentModel.DataAnnotations;

namespace E_commerce.DTOs.Chat
{
    public class SendMessageRequest
    {
        /// <summary>null = tạo session mới</summary>
        public Guid? SessionId { get; set; }

        [Required(ErrorMessage = "Content is required.")]
        [StringLength(2000, MinimumLength = 1)]
        public string Content { get; set; } = string.Empty;
    }
}
