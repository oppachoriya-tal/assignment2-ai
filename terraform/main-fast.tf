terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region  = "us-east-1"
  profile = "aiAssignment-2"
}

# Get latest Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
}

# Simple Security Group
resource "aws_security_group" "app_sg" {
  name        = "bookreview-app-sg"
  description = "BookReview App Security Group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3333
    to_port     = 3333
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bookreview-app-sg"
  }
}

# EC2 Instance
resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "m7i-flex.large"
  key_name              = "oppachoriya-tal-robot-cli"
  vpc_security_group_ids = [aws_security_group.app_sg.id]

  tags = {
    Name = "bookreview-app"
  }

  user_data = base64encode(<<-EOF
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

echo "=== Fast BookReview Deployment ==="
echo "Deployment started at: $(date)"
echo "NOTE: Remember to update GEMINI_API_KEY in backend/.env after deployment"

# Install essentials
apt-get update -y
apt-get install -y curl git wget unzip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable --now docker
usermod -aG docker ubuntu

# Clone or update repo
if [ -d "/opt/app" ]; then
  echo "Repository exists, updating..."
  cd /opt/app
  git fetch origin
  git reset --hard origin/main
else
  echo "Cloning repository..."
  git clone https://github.com/oppachoriya-tal/assignment2-ai.git /opt/app
  cd /opt/app
fi

# Get IP
AWS_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Create env files
cat > backend/.env << 'BACKEND_ENV'
NODE_ENV=production
DATABASE_URL=postgresql://bookreview_user:bookreview_password@postgres:5432/bookreview_db?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
PORT=3000
CORS_ORIGIN=*
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-1.5-flash
API_BASE_URL=http://$AWS_IP:3000
FRONTEND_URL=http://$AWS_IP:3333
BACKEND_ENV

cat > frontend/.env << FRONTEND_ENV
VITE_API_BASE=http://$AWS_IP:3000
VITE_NODE_ENV=production
VITE_FRONTEND_URL=http://$AWS_IP:3333
FRONTEND_ENV

# Build and start services
docker compose build --parallel --no-cache
docker compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Setup database
echo "Setting up database..."
for i in {1..5}; do
  if docker compose exec -T postgres pg_isready -U bookreview_user; then
    echo "Database is ready, setting up schema..."
    docker compose exec -T backend npx prisma db push --force-reset
    docker compose exec -T backend npx prisma generate
    echo "Running comprehensive book seeding with sample data..."
    docker compose exec -T backend node dist/database/seed-books.js
    echo "Database setup complete with comprehensive book data"
    break
  fi
  echo "Database not ready, attempt $i, retrying..."
  sleep 10
done

# Restart backend
docker compose restart backend

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
sleep 20

# Create update script
cat > /opt/app/update-app.sh << 'UPDATE_SCRIPT'
#!/bin/bash
set -e
echo "=== Updating BookReview App ==="

cd /opt/app

# Backup current environment files
if [ -f "backend/.env" ]; then
  cp backend/.env backend/.env.backup
  echo "Backed up current backend/.env"
fi

# Pull latest changes
git fetch origin
git reset --hard origin/main

# Restore environment files if they exist
if [ -f "backend/.env.backup" ]; then
  cp backend/.env.backup backend/.env
  echo "Restored backend/.env from backup"
fi

# Get current IP
AWS_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Update dynamic URLs in backend/.env
sed -i "s|API_BASE_URL=.*|API_BASE_URL=http://$AWS_IP:3000|g" backend/.env
sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://$AWS_IP:3333|g" backend/.env

# Rebuild and restart services
docker compose down
docker compose build --parallel --no-cache
docker compose up -d

# Wait for services
sleep 30
echo "Services updated successfully"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
UPDATE_SCRIPT

chmod +x /opt/app/update-app.sh

# Final health check
echo "=== Final Health Check ==="
sleep 10

# Test endpoints
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
  echo "✓ Backend health check: OK"
else
  echo "✗ Backend health check: FAILED"
fi

if curl -f http://localhost:3333 > /dev/null 2>&1; then
  echo "✓ Frontend check: OK"
else
  echo "✗ Frontend check: FAILED"
fi

# Final status report
echo "=== Deployment Status Report ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=== Deployment Complete Successfully ==="
echo "Backend: http://$AWS_IP:3000"
echo "Frontend: http://$AWS_IP:3333"
echo "Health Check: http://$AWS_IP:3000/health"
echo ""
echo "IMPORTANT: Update GEMINI_API_KEY in backend/.env for AI features to work"
echo "Get your API key from: https://makersuite.google.com/app/apikey"
echo ""
echo "To update app in future, run: /opt/app/update-app.sh"
echo "Deployment completed at: $(date)"
EOF
)
}

# Outputs
output "public_ip" {
  value = aws_instance.app.public_ip
}

output "backend_url" {
  value = "http://${aws_instance.app.public_ip}:3000"
}

output "frontend_url" {
  value = "http://${aws_instance.app.public_ip}:3333"
}