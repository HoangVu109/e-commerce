using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce.Models
{
    public class ChatMessage
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid SessionId { get; set; }

        [ForeignKey(nameof(SessionId))]
        public virtual ChatSession Session { get; set; } = null!;

        [Required]
        public Guid SenderId { get; set; }

        [ForeignKey(nameof(SenderId))]
        public virtual User Sender { get; set; } = null!;

        [Required]
        [StringLength(2000)]
        public string Content { get; set; } = string.Empty;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;
    }
}
