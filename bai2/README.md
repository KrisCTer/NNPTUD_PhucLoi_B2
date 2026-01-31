# Châu Phúc Lợi - 2280601833

# Bài 2 - Post Management

## Hướng dẫn cài đặt và chạy
1. Mở terminal gõ:
```bash
npm install json-server
```

2. File `db.json` đã được cấu hình sẵn với nội dung:
```json
{
  "$schema": "./node_modules/json-server/schema.json",
  "posts": [
    { "id": "1", "title": "a title", "views": 100 },
    { "id": "2", "title": "another title", "views": 200 }
  ],
  "comments": [
    { "id": "1", "text": "a comment about post 1", "postId": "1" },
    { "id": "2", "text": "another comment about post 1", "postId": "1" }
  ],
  "profile": {
    "name": "typicode"
  }
}
```

3. Quay lại terminal gõ lệnh để chạy server:
- Lệnh đầy đủ: `npx json-server bai2/db.json --static bai2 --port 3000`
- Lệnh rút gọn: `npm run bai2`

**Lưu ý:** Nếu muốn tắt server thì bấm `Ctrl + C`.
