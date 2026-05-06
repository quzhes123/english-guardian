#!/bin/bash
# ============================================================
# 英语守护者 - 一键自动部署设置脚本
# ============================================================
# 
# 使用方法：
# 1. 先在 GitHub 上完成授权 (运行 gh auth login)
# 2. 然后运行此脚本
#

set -e

echo "=========================================="
echo "  英语守护者 - 自动部署设置"
echo "=========================================="
echo ""

# 检查 gh 是否安装
if ! command -v gh &> /dev/null; then
    echo "❌ gh 未安装"
    echo "   请先安装: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    exit 1
fi

# 检查是否已登录
echo "检查 GitHub 登录状态..."
if ! gh auth status &> /dev/null; then
    echo ""
    echo "⚠️  需要先登录 GitHub"
    echo ""
    echo "请运行以下命令完成登录："
    echo "   gh auth login -h github.com -w"
    echo ""
    echo "然后在浏览器中输入显示的验证码"
    echo ""
    exit 1
fi

echo "✅ 已登录 GitHub"

# 检查远程仓库是否存在
REPO_NAME="english-guardian"
REPO_EXISTS=false

echo ""
echo "检查远程仓库..."
if gh repo view "$REPO_NAME" &> /dev/null; then
    echo "✅ 仓库 $REPO_NAME 已存在"
    REPO_EXISTS=true
else
    echo "📦 创建仓库 $REPO_NAME..."
    gh repo create "$REPO_NAME" --public --source=. --push
    echo "✅ 仓库创建并推送成功"
    REPO_EXISTS=true
fi

# 添加远程仓库（如果不存在）
cd "$(dirname "$0")/.."
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  未找到 origin 远程仓库"
    echo "请手动添加："
    echo "   git remote add origin git@github.com:YOUR_USERNAME/$REPO_NAME.git"
fi

echo ""
echo "=========================================="
echo "  下一步：配置微信小程序 Secrets"
echo "=========================================="
echo ""
echo "1. 在微信公众平台获取 AppID 和私钥："
echo "   https://mp.weixin.qq.com -> 开发管理 -> 开发设置"
echo ""
echo "2. 设置环境变量并运行："
echo "   export WX_APPID=your_appid"
echo "   export WX_PRIVATE_KEY=\"$(cat ~/.ssh/id_rsa)\""
echo "   node scripts/setup-secrets.js"
echo ""
echo "=========================================="
