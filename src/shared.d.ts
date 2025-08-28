//! This file is part of ShadowFiles (https://github.com/Coder-0178/ShadowFiles)
//! Licensed under AGPLv3-or-later, Copyright (C) Jonathon Woolston
// types only

/** Page->SW Messages */
export type ClientMessage = {
  type: "delete" | "update" | "exists";
  source: "page";
  path: string;
} & ShadowFilesMessage;

export type CreateAssetMessage = {
  type: "update";
  headers: Record<string, string>;
} & ClientMessage;

/** SW->Page Messages */
export type SwMessage = {
  source: "sw";
  status: "success" | "fail";
} & ShadowFilesMessage;

export type ShadowFilesMessage = {
  _libSource: "#libShadowFiles";
  id: string;
  source: "sw" | "page";
};
