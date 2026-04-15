"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckStatus = exports.CheckType = void 0;
/**
 * Check type enum.
 */
var CheckType;
(function (CheckType) {
    CheckType["RECEIVED"] = "received";
    CheckType["GIVEN"] = "given";
})(CheckType || (exports.CheckType = CheckType = {}));
/**
 * Check status enum.
 */
var CheckStatus;
(function (CheckStatus) {
    CheckStatus["PENDING"] = "pending";
    CheckStatus["PAID"] = "paid";
    CheckStatus["CANCELLED"] = "cancelled";
    CheckStatus["BOUNCED"] = "bounced";
})(CheckStatus || (exports.CheckStatus = CheckStatus = {}));
//# sourceMappingURL=payment.enums.js.map