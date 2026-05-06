/**
 * 自动上传脚本
 * 需要在 GitHub Secrets 中配置 WX_APPID 和 WX_PRIVATE_KEY
 */

const path = require('path');
const { upload, Project } = require('miniprogram-ci');

async function uploadProject() {
  const wxAppid = process.env.WX_APPID;
  const privateKey = process.env.WX_PRIVATE_KEY;

  if (!wxAppid || !privateKey) {
    console.error('请设置 WX_APPID 和 WX_PRIVATE_KEY 环境变量');
    process.exit(1);
  }

  try {
    const project = new Project({
      appid: wxAppid,
      type: 'miniProgram',
      projectPath: process.cwd(),
      privateKey: privateKey,
      ignores: ['node_modules/**', '.git/**', '*.md'],
    });

    const result = await upload({
      project,
      version: '1.0.0',
      desc: '通过 GitHub Actions 自动上传',
    });

    console.log('上传成功:', result);
  } catch (err) {
    console.error('上传失败:', err);
    process.exit(1);
  }
}

uploadProject();
