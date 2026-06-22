namespace E_commerce.DTOs.Order
{
    public class OrderItemRequest
    {
        public Guid ProductVariantId {get; set;}
        public int Quantity {get; set;}
    }
}
