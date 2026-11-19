package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type OrderItem struct {
	SKU       string `json:"sku"`
	Qty       uint32 `json:"qty"`
	UnitCents uint64 `json:"unit_cents"`
}

type OrderPayload struct {
	OrderID  string      `json:"order_id"`
	TenantID uint32      `json:"tenant_id"`
	Metadata string      `json:"metadata"`
	Items    []OrderItem `json:"items"`
}

type IngestAck struct {
	Status     string `json:"status"`
	OrderID    string `json:"order_id"`
	TenantID   uint32 `json:"tenant_id"`
	ItemCount  int    `json:"item_count"`
	TotalCents uint64 `json:"total_cents"`
	MetaBytes  int    `json:"meta_bytes"`
}

func main() {
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()

	r.GET("/health", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	r.POST("/api/v1/ingest", func(c *gin.Context) {
		var payload OrderPayload
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.Status(http.StatusBadRequest)
			return
		}

		var totalCents uint64
		for _, item := range payload.Items {
			totalCents += uint64(item.Qty) * item.UnitCents
		}

		c.JSON(http.StatusOK, IngestAck{
			Status:     "ACK_INGESTED",
			OrderID:    payload.OrderID,
			TenantID:   payload.TenantID,
			ItemCount:  len(payload.Items),
			TotalCents: totalCents,
			MetaBytes:  len(payload.Metadata),
		})
	})

	_ = r.Run("0.0.0.0:8080")
}
