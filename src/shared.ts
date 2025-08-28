// types only
type SwMessage = {
    type: "create" | "delete" | "update" | "exists",
    _libSource: "#libShadowFiles"
    id: string,
}