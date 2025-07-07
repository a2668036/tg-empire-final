const app = require('./app');

// 获取端口号
const PORT = process.env.PORT || 3000;
 
// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器已启动，运行在端口: ${PORT}`);
}); 