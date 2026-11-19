-- wrk Lua script sending a deterministic ~4 KB JSON payload
wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"

local items = {}
for i = 0, 23 do
  table.insert(items, string.format('{"sku":"GLASTOR-SKU-%04d","qty":%d,"unit_cents":%d}', i, (i % 5) + 1, 1250 + i * 100))
end

local padding = string.rep("x", 2400)
wrk.body = string.format(
  '{"order_id":"ord_01JGLASTORBENCHMARK4KB0001","tenant_id":42,"metadata":"%s","items":[%s]}',
  padding,
  table.concat(items, ",")
)
