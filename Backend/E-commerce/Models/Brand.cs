using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace E_commerce.Models
{
    public class Brand
    {
        [Key] // khóa chính
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [StringLength(150)]
        public string Name { get; set; } // tên brand 
        public virtual ICollection<Product> Products { get; set; } = new List<Product>();
        // 1 Brand -> n Product
    }
}
