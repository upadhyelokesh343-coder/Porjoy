import re

with open('src/pages/Wallet.tsx', 'r') as f:
    content = f.read()

# Let's insert UTR right after the date and status
old_ui = """                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span>{safeFormatDate(tx.date)}</span>
                      <span className="flex items-center gap-1">
                        • <StatusIcon status={tx.status} /> {tx.status}
                      </span>
                    </div>"""

new_ui = """                    <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                      <span>{safeFormatDate(tx.date)}</span>
                      <span className="flex items-center gap-1">
                        • <StatusIcon status={tx.status} /> {tx.status}
                      </span>
                    </div>
                    {tx.utr && (
                      <p className="text-[10px] text-neutral-500 mt-1 font-mono">UTR: {tx.utr}</p>
                    )}
                    {tx.reference && !tx.utr && (
                      <p className="text-[10px] text-neutral-500 mt-1 font-mono">Ref: {tx.reference}</p>
                    )}"""

content = content.replace(old_ui, new_ui)

with open('src/pages/Wallet.tsx', 'w') as f:
    f.write(content)

print("Wallet patched to show UTR.")
