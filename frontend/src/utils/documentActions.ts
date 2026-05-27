import type { Router } from 'vue-router'

export interface DocumentActionSource {
  title: string
  content: string
  type?: string
}

export function downloadDocumentFile(document: DocumentActionSource): void {
  const ext = document.type === 'text' ? 'txt' : 'md'
  const blob = new Blob([document.content || ''], {
    type: 'text/markdown;charset=utf-8'
  })
  const url = window.URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = `${document.title}.${ext}`
  window.document.body.appendChild(anchor)
  anchor.click()
  window.document.body.removeChild(anchor)
  window.URL.revokeObjectURL(url)
}

export function buildDocumentShareUrl(
  router: Router,
  projectId: string,
  documentId: string
): string {
  const documentUrl = router.resolve({
    name: 'document',
    params: { projectId, documentId }
  }).href
  const baseUrl = window.location.origin + window.location.pathname.replace(/#.*$/, '')
  return baseUrl + documentUrl
}

export async function copyDocumentShareUrl(url: string): Promise<void> {
  await navigator.clipboard.writeText(url)
}
