import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

old_status = """  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };"""

new_status = """  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'rejected':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };"""

content = content.replace(old_status, new_status)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Status icon patched.")
