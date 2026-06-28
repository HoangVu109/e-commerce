using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce.Models
{
    public class ChatSession
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid CustomerId { get; set; }

        [ForeignKey(nameof(CustomerId))]
        public virtual User Customer { get; set; } = null!;

        public Guid? StaffId { get; set; }

        [ForeignKey(nameof(StaffId))]
        public virtual User? Staff { get; set; }

        [Required]
        public ChatSessionStatus Status { get; set; } = ChatSessionStatus.Open;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
    }

    public enum ChatSessionStatus
    {
        Open,
        Closed
    }
}
