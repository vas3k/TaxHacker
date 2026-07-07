import {
  PaperlessApiError,
  PaperlessCorrespondent,
  PaperlessDocument,
  PaperlessDocumentListParams,
  PaperlessDocumentType,
  PaperlessPaginatedResponse,
  PaperlessTag,
  PaperlessTaskStatus,
  PaperlessUploadMetadata,
} from "./types"

const REQUEST_TIMEOUT_MS = 30000

function validatePaperlessUrl(raw: string): string {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("Invalid URL format")
  }
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only HTTP and HTTPS protocols are allowed")
  }
  return url.origin + url.pathname.replace(/\/+$/, "")
}

export interface PaperlessClient {
  testConnection(): Promise<boolean>
  listDocuments(params?: PaperlessDocumentListParams): Promise<PaperlessPaginatedResponse<PaperlessDocument>>
  getDocument(id: number): Promise<PaperlessDocument>
  downloadDocument(id: number, original?: boolean): Promise<{ buffer: Buffer; contentType: string; filename: string }>
  uploadDocument(
    file: Buffer,
    filename: string,
    metadata?: PaperlessUploadMetadata
  ): Promise<string>
  getTaskStatus(taskId: string): Promise<PaperlessTaskStatus>
  listTags(): Promise<PaperlessTag[]>
  createTag(name: string): Promise<PaperlessTag>
  listCorrespondents(): Promise<PaperlessCorrespondent[]>
  createCorrespondent(name: string): Promise<PaperlessCorrespondent>
  listDocumentTypes(): Promise<PaperlessDocumentType[]>
}

export function createPaperlessClient(baseUrl: string, apiToken: string): PaperlessClient {
  const validatedBaseUrl = validatePaperlessUrl(baseUrl)

  const headers: Record<string, string> = {
    Authorization: `Token ${apiToken}`,
    Accept: "application/json; version=5",
  }

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${validatedBaseUrl}/api${path}`
    const response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...init?.headers,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      if (response.status === 401 || response.status === 403) {
        throw new PaperlessApiError(response.status, response.statusText, "Invalid API token or insufficient permissions")
      }
      throw new PaperlessApiError(response.status, response.statusText, body)
    }

    return response.json() as Promise<T>
  }

  async function requestRaw(path: string): Promise<Response> {
    const url = `${validatedBaseUrl}/api${path}`
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      const body = await response.text().catch(() => "")
      throw new PaperlessApiError(response.status, response.statusText, body)
    }

    return response
  }

  async function fetchAllPages<T>(path: string): Promise<T[]> {
    const results: T[] = []
    let page = 1
    while (true) {
      const separator = path.includes("?") ? "&" : "?"
      const response = await request<PaperlessPaginatedResponse<T>>(`${path}${separator}page=${page}&page_size=100`)
      results.push(...response.results)
      if (!response.next) break
      page++
    }
    return results
  }

  return {
    async testConnection(): Promise<boolean> {
      await request<Record<string, string>>("/")
      return true
    },

    async listDocuments(
      params: PaperlessDocumentListParams = {}
    ): Promise<PaperlessPaginatedResponse<PaperlessDocument>> {
      const searchParams = new URLSearchParams()
      if (params.page) searchParams.set("page", String(params.page))
      if (params.page_size) searchParams.set("page_size", String(params.page_size))
      if (params.query) searchParams.set("query", params.query)
      if (params.correspondent__id) searchParams.set("correspondent__id", String(params.correspondent__id))
      if (params.tags__id__in?.length) searchParams.set("tags__id__in", params.tags__id__in.join(","))
      if (params.created__date__gt) searchParams.set("created__date__gt", params.created__date__gt)
      if (params.created__date__lt) searchParams.set("created__date__lt", params.created__date__lt)
      if (params.ordering) searchParams.set("ordering", params.ordering)

      const query = searchParams.toString()
      return request<PaperlessPaginatedResponse<PaperlessDocument>>(`/documents/${query ? `?${query}` : ""}`)
    },

    async getDocument(id: number): Promise<PaperlessDocument> {
      return request<PaperlessDocument>(`/documents/${id}/`)
    },

    async downloadDocument(
      id: number,
      original = true
    ): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
      const response = await requestRaw(`/documents/${id}/download/${original ? "?original=true" : ""}`)
      const contentType = response.headers.get("content-type") || "application/octet-stream"

      let filename = `document-${id}`
      const disposition = response.headers.get("content-disposition")
      if (disposition) {
        const match = disposition.match(/filename[*]?=(?:UTF-8''|"?)([^";]+)"?/i)
        if (match) filename = decodeURIComponent(match[1])
      }

      const arrayBuffer = await response.arrayBuffer()
      return { buffer: Buffer.from(arrayBuffer), contentType, filename }
    },

    async uploadDocument(file: Buffer, filename: string, metadata?: PaperlessUploadMetadata): Promise<string> {
      const formData = new FormData()
      formData.append("document", new Blob([file]), filename)

      if (metadata?.title) formData.append("title", metadata.title)
      if (metadata?.created) formData.append("created", metadata.created)
      if (metadata?.correspondent) formData.append("correspondent", String(metadata.correspondent))
      if (metadata?.document_type) formData.append("document_type", String(metadata.document_type))
      if (metadata?.archive_serial_number) {
        formData.append("archive_serial_number", String(metadata.archive_serial_number))
      }
      if (metadata?.tags) {
        for (const tagId of metadata.tags) {
          formData.append("tags", String(tagId))
        }
      }

      const url = `${validatedBaseUrl}/api/documents/post_document/`
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiToken}`,
          Accept: "application/json; version=5",
        },
        body: formData,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS * 2),
      })

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        throw new PaperlessApiError(response.status, response.statusText, body)
      }

      const taskId = await response.text()
      return taskId.replace(/"/g, "").trim()
    },

    async getTaskStatus(taskId: string): Promise<PaperlessTaskStatus> {
      const response = await request<PaperlessTaskStatus[]>(`/tasks/?task_id=${taskId}`)
      if (!Array.isArray(response) || response.length === 0) {
        throw new Error(`Task ${taskId} not found`)
      }
      return response[0]
    },

    async listTags(): Promise<PaperlessTag[]> {
      return fetchAllPages<PaperlessTag>("/tags/")
    },

    async createTag(name: string): Promise<PaperlessTag> {
      return request<PaperlessTag>("/tags/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    },

    async listCorrespondents(): Promise<PaperlessCorrespondent[]> {
      return fetchAllPages<PaperlessCorrespondent>("/correspondents/")
    },

    async createCorrespondent(name: string): Promise<PaperlessCorrespondent> {
      return request<PaperlessCorrespondent>("/correspondents/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
    },

    async listDocumentTypes(): Promise<PaperlessDocumentType[]> {
      return fetchAllPages<PaperlessDocumentType>("/document_types/")
    },
  }
}
