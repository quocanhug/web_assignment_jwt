package vn.iotstar.service;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${security.jwt.secret-key}")
    private String secretKey;

    @Value("${security.jwt.expiration-time}")
    private long jwtExpiration;

    public String extractUsername(String token) {
        try {
            SignedJWT signedJWT = parseToken(token);
            return signedJWT.getJWTClaimsSet().getSubject();
        } catch (ParseException e) {
            return null;
        }
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        try {
            JWSSigner signer = new MACSigner(getSigningKeyBytes());

            Date now = new Date();
            Date expiryDate = new Date(now.getTime() + jwtExpiration);

            JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
                    .subject(userDetails.getUsername())
                    .issuer("HCMUTE_WEBPR330479")
                    .issueTime(now)
                    .expirationTime(expiryDate);

            if (extraClaims != null) {
                extraClaims.forEach(builder::claim);
            }

            JWTClaimsSet claimsSet = builder.build();

            SignedJWT signedJWT = new SignedJWT(
                    new JWSHeader(JWSAlgorithm.HS256),
                    claimsSet
            );

            signedJWT.sign(signer);
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException("Error signing JWT with Nimbus: " + e.getMessage(), e);
        }
    }

    public long getExpirationTime() {
        return jwtExpiration;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            SignedJWT signedJWT = parseToken(token);
            JWSVerifier verifier = new MACVerifier(getSigningKeyBytes());

            // 1. Verify Nimbus HMAC signature
            if (!signedJWT.verify(verifier)) {
                return false;
            }

            // 2. Verify Subject matches UserDetails
            String username = signedJWT.getJWTClaimsSet().getSubject();
            if (username == null || !username.equals(userDetails.getUsername())) {
                return false;
            }

            // 3. Verify Expiration
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            return expirationTime != null && !expirationTime.before(new Date());

        } catch (ParseException | JOSEException e) {
            return false;
        }
    }

    public SignedJWT parseToken(String token) throws ParseException {
        return SignedJWT.parse(token);
    }

    public JWTClaimsSet extractAllClaims(String token) throws ParseException {
        return parseToken(token).getJWTClaimsSet();
    }

    private byte[] getSigningKeyBytes() {
        try {
            // Check if secretKey is 64-character hex string
            if (secretKey.matches("^[0-9a-fA-F]{64,}$")) {
                int len = secretKey.length();
                byte[] data = new byte[len / 2];
                for (int i = 0; i < len; i += 2) {
                    data[i / 2] = (byte) ((Character.digit(secretKey.charAt(i), 16) << 4)
                            + Character.digit(secretKey.charAt(i + 1), 16));
                }
                if (data.length >= 32) {
                    return data;
                }
            }
        } catch (Exception ignored) {
        }

        byte[] raw = secretKey.getBytes(StandardCharsets.UTF_8);
        if (raw.length < 32) {
            byte[] padded = new byte[32];
            System.arraycopy(raw, 0, padded, 0, raw.length);
            return padded;
        }
        return raw;
    }
}
