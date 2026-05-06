# 英语守护者 - 自动部署指南

## 📋 当前状态

✅ Git 仓库已初始化  
⏳ 等待 GitHub 授权  
⏳ 等待创建 GitHub 仓库  
⏳ 等待配置 Secrets  

---

## 🚀 完成以下步骤来实现自动部署

### 第一步：GitHub 授权（约2分钟）

在终端运行：

```bash
export PATH="$HOME/npm-global/gh-bin/bin:$PATH"
gh auth login -h github.com -w
```

然后：
1. 浏览器会打开 GitHub 授权页面
2. 输入终端显示的验证码（如：`11BB-F89B`）
3. 点击 **Authorize**

---

### 第二步：创建 GitHub 仓库（约1分钟）

授权成功后，在终端运行：

```bash
export PATH="$HOME/npm-global/gh-bin/bin:$PATH"
cd ~/mini-programs/english-guardian
gh repo create english-guardian --public --source=. --push
```

---

### 第三步：配置微信小程序（约5分钟）

#### 3.1 获取 AppID

1. 打开 https://mp.weixin.qq.com
2. 登录 → 开发管理 → 开发设置
3. 复制 **AppID**（格式如：`wx1234567890abcdef`）

#### 3.2 获取私钥

1. 在同一页面找到 **小程序代码上传密钥**
2. 如果没有，点击「生成」按钮生成一个
3. 点击「下载」下载私钥文件（`PRIVATE_KEY.txt`）

#### 3.3 设置 Secrets

在终端运行：

```bash
# 设置 AppID
export WX_APPID=你的AppID

# 设置私钥（注意换行符需要处理）
export WX_PRIVATE_KEY="$(cat ~/Downloads/private_key.txt | tr '\n' ' ' | sed 's/ /\\n/g')"

# 或者直接把私钥内容粘贴进去
export WX_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSj...
-----END PRIVATE KEY-----"

# 运行配置脚本
cd ~/mini-programs/english-guardian
node scripts/setup-secrets.js
```

---

### 第四步：验证自动部署

完成以上步骤后：

1. 修改任意代码文件
2. `git add . && git commit -m "test"`
3. `git push`

大约1-2分钟后，打开：
https://github.com/YOUR_USERNAME/english-guardian/actions

如果看到绿色的 ✓，说明自动部署成功！

---

## 🔧 常用命令

```bash
# 查看 GitHub Actions 状态
export PATH="$HOME/npm-global/gh-bin/bin:$PATH"
gh run list

# 查看仓库设置
gh repo view english-guardian --web

# 查看 Secrets
gh secret list
```

---

## ❓ 常见问题

### Q: gh auth login 超时了怎么办？
A: 重新运行 `gh auth login -h github.com -w`

### Q: 推送代码时提示权限不足？
A: 检查 SSH key 是否已添加到 GitHub：
   Settings → SSH and GPG keys → New SSH key

### Q: 自动部署失败了怎么办？
A: 查看 Actions 日志排查问题，常见错误：
   - AppID 错误
   - 私钥格式错误（确保是完整的 pkcs8 格式）

---

## 📞 需要帮助？

遇到问题随时问我！
