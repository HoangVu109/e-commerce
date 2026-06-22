using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce.Models
{
    public class OrderDetail
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required(ErrorMessage ="OrderId is required.")]
        public Guid OrderId { get; set; }

        [ForeignKey("OrderId")]
        public Order? Order { get; set; }
        // ?: Có thể có hoặc chưa có object order được load trong memory

        [Required(ErrorMessage ="ProductVariantId is required.")]
        public Guid ProductVariantId { get; set; }

        [ForeignKey("ProductVariantId")]
        public ProductVariant? ProductVariant { get; set; }

        [Required]
        [Range(1,int.MaxValue)]
        public int OrderQuantity { get; set; }

        [Required(ErrorMessage ="Unit Price is required.")]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }
    }
}
