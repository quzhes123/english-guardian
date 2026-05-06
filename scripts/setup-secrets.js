#!/usr/bin/env node
/**
 * GitHub Secrets 配置脚本
 * 
 * 使用方法：
 * 1. 先在 GitHub 上创建仓库
 * 2. 设置 GitHub Personal Access Token 作为环境变量
 * 3. 运行此脚本设置 Secrets
 * 
 * 环境变量：
 * - GITHUB_TOKEN: GitHub Personal Access Token (需要 repo 和 admin:org 权限)
 * - WX_APPID: 微信小程序 AppID
 * - WX_PRIVATE_KEY: 微信小程序私钥内容
 */

const https = require('https');

const repoOwner = process.env.GH_OWNER || 'YOUR_GITHUB_USERNAME';
const repoName = 'english-guardian';
const token = process.env.GH_TOKEN;

if (!token) {
  console.error('请设置 GH_TOKEN 环境变量');
  console.error('GH_TOKEN=your_github_personal_access_token node setup-secrets.js');
  process.exit(1);
}

async function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'English Guardian Deployer'
      }
    };
    
    if (body) {
      options.headers['Content-Type'] = 'application/json';
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function setSecret(secretName, secretValue) {
  // Get the public key for the repo
  const keyRes = await request('GET', `/repos/${repoOwner}/${repoName}/actions/secrets/public-key`);
  
  if (keyRes.status !== 200) {
    throw new Error(`获取公钥失败: ${keyRes.status} ${JSON.stringify(keyRes.data)}`);
  }
  
  const { key_id, key } = keyRes.data;
  
  // Encrypt the secret using Node.js crypto
  const crypto = require('crypto');
  const publicKey = Buffer.from(key, 'base64');
  const encrypted = crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
    Buffer.from(secretValue)
  );
  
  const encryptedValue = encrypted.toString('base64');
  
  // Set the secret
  const setRes = await request('PUT', `/repos/${repoOwner}/${repoName}/actions/secrets/${secretName}`, {
    encrypted_value: encryptedValue,
    key_id
  });
  
  if (setRes.status === 201 || setRes.status === 204) {
    console.log(`✓ Secret ${secretName} 设置成功`);
  } else {
    throw new Error(`设置 Secret 失败: ${setRes.status} ${JSON.stringify(setRes.data)}`);
  }
}

async function main() {
  console.log('开始配置 GitHub Secrets...');
  console.log(`仓库: ${repoOwner}/${repoName}\n`);
  
  const wxAppid = process.env.WX_APPID;
  const wxPrivateKey = process.env.WX_PRIVATE_KEY;
  
  if (!wxAppid || !wxPrivateKey) {
    console.error('请设置 WX_APPID 和 WX_PRIVATE_KEY 环境变量');
    process.exit(1);
  }
  
  try {
    await setSecret('WX_APPID', wxAppid);
    await setSecret('WX_PRIVATE_KEY', wxPrivateKey);
    console.log('\n✅ 所有 Secrets 配置完成！');
  } catch (err) {
    console.error('\n❌ 配置失败:', err.message);
    process.exit(1);
  }
}

main();
