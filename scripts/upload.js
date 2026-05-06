/**
 * 自动上传脚本
 * 需要在 GitHub Secrets 中配置 WX_APPID 和 WX_PRIVATE_KEY
 */

const path = require('path');
const { upload } = require('miniprogram-ci');

async function uploadProject() {
  const wxAppid = process.env.WX_APPID;
  const privateKey = process.env.WX_PRIVATE_KEY;
  
  if (!wxAppid || !privateKey) {
    console.error('请设置 WX_APPID 和 WX_PRIVATE_KEY 环境变量');
    process.exit(1);
  }
  
  try {
    const result = await upload({
      appid: wxAppid,
      type: 'miniProgram',
      projectPath: process.cwd(),
      privateKey: privateKey,
      ignores: ['node_modules/**', '.git/**', '*.md'],
    });
    
    console.log('上传成功:', result);
  } catch (err) {
    console.error('上传失败:', err);
    process.exit(1);
  }
}

uploadProject();
