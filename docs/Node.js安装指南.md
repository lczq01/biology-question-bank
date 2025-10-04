# Node.js 安装指南

## 当前状态
- Node.js 安装路径：`D:\Program Files\nodejs`
- 需要配置环境变量以便在命令行中使用

## 解决方案

### 方法1：配置系统环境变量（推荐）
1. 按 `Win + R`，输入 `sysdm.cpl`，按回车
2. 点击"高级"选项卡
3. 点击"环境变量"按钮
4. 在"系统变量"中找到"Path"，双击编辑
5. 点击"新建"，添加：`D:\Program Files\nodejs`
6. 点击"确定"保存所有设置
7. **重新打开PowerShell**验证：
   ```powershell
   node --version
   npm --version
   ```

### 方法2：临时设置（当前会话有效）
```powershell
$env:PATH = $env:PATH + ";D:\Program Files\nodejs"
node --version
npm --version
```

### 方法3：使用完整路径
```powershell
& "D:\Program Files\nodejs\node.exe" --version
& "D:\Program Files\nodejs\npm.cmd" --version
```

## 安装项目依赖

配置好环境变量后，运行：
```powershell
cd biology-question-bank/backend
npm install

cd ../frontend  
npm install
```

## 验证安装
```powershell
# 检查Node.js版本
node --version

# 检查npm版本  
npm --version

# 检查项目依赖
cd biology-question-bank/backend
npm list

cd ../frontend
npm list