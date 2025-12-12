"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownershipTypeFromString = ownershipTypeFromString;
/**
 * Converts a string to an Ownership enum.
 * @param type - The ownership type as a string.
 * @returns The ownership type as an Ownership enum.
 */
function ownershipTypeFromString(type) {
    switch (type.toLowerCase()) {
        case "owned":
            return RealtimeStoreCreateOptions.Ownership.Owned;
        case "unowned":
            return RealtimeStoreCreateOptions.Ownership.Unowned;
        default:
            throw new Error("Invalid ownership type: " + type);
    }
}
//# sourceMappingURL=OwnershipType.js.map