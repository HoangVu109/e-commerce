using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce.Models
{
    public class SupportRequest
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required(ErrorMessage = "UserId is required.")]
        public Guid UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public virtual User User { get; set; }

        public Guid? StaffId { get; set; }

        [ForeignKey(nameof(StaffId))]
        public virtual User? Staff { get; set; }

        public Guid? OrderId { get; set; }

        [ForeignKey(nameof(OrderId))]
        public virtual Order? Order { get; set; }

        [Required(ErrorMessage = "Subject is required.")]
        [StringLength(150)]
        public string Subject { get; set; }

        [Required(ErrorMessage = "Message is required.")]
        [StringLength(1000)]
        public string Message { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pending";
        // Pending / InProgress / Resolved

        public DateTime CreatedDate { get; set; } = DateTime.Now;
    }
}
