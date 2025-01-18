const { tenantManager } = require("../../utils/firebase_admin");
const prisma  = require("../../utils/prisma_client");

module.exports.tenantAuth = async ({org_id=null, tenant_id=null}) => {
    try {
        if(org_id) {
            const tenant = await prisma.organization.findUnique({
                where:{
                    id: org_id
                }
            })
    
            if(!tenant) {
                throw new Error("Organization not found");
            }
    
            const tenantAuth = await tenantManager.authForTenant(tenant.tenant_id);
            return tenantAuth;
        }
        else if(tenant_id) {
            const tenantAuth = await tenantManager.authForTenant(tenant_id);
            return tenantAuth;
        }
        else {
            throw new Error("Organization ID or Tenant ID is required");
        }
    } catch (error) {
        next(error);
    }
}